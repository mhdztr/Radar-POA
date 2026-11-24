/**
 * services/AdminService.js
 * Admin Panel (Fase 13): kelola pengguna + audit log. Semua read/write di sini
 * SUPERADMIN-ONLY (PRD §4: "Data User dikelola Superadmin"); halaman Admin
 * untuk DIREKTUR hanya menampilkan tab Persetujuan (data dari auth_*).
 *
 * Fungsi publik (dipanggil via google.script.run dari frontend):
 *   admin_getUsers(token)
 *   admin_updateUser(token, params)    — ubah role / divisi / status
 *   admin_resetPassword(token, params)
 *   admin_getAuditLog(token, params)
 *
 * Keamanan:
 * - assertScope(session, [SUPERADMIN], null) di setiap fungsi.
 * - withLock() utk semua tulis (AGENTS.md §3 / ARCHITECTURE.md §11).
 * - Pengaman: pengguna tidak bisa mengubah role/status dirinya sendiri;
 *   akun SUPERADMIN aktif terakhir tidak bisa dikunci (dihapus ke non-SUPERADMIN
 *   atau dinonaktifkan) — mencegah lockout total.
 * - Semua tulis dicatat ke Audit_Log (Aksi UPDATE — enum tidak diperluas).
 */

// ===========================================================================
// FUNGSI PUBLIK
// ===========================================================================

/**
 * Daftar seluruh pengguna (termasuk PENDING/REJECTED/NONAKTIF) + info divisi.
 * Hanya SUPERADMIN.
 * @param {string} token
 */
function admin_getUsers(token) {
  try {
    var session = _requireSession(token);
    assertScope(session, [ROLE.SUPERADMIN], null);

    var usersSheet  = openMasterSheet(SHEET_MASTER.USERS);
    var divisiSheet = openMasterSheet(SHEET_MASTER.DIVISI);

    // Semua nilai dikonversi eksplisit ke string/null agar JSON.stringify GAS
    // tidak mengembalikan null akibat Date object atau tipe non-serializable.
    function _cellStr(v) {
      if (v === null || v === undefined || v === '') return '';
      if (v instanceof Date) return v.toISOString();
      return String(v);
    }

    var namaDivisi = {};
    sheetToObjects(divisiSheet).forEach(function (dv) {
      namaDivisi[_cellStr(dv['DivisiID'])] = _cellStr(dv['NamaDashboard'] || dv['NamaResmi'] || dv['DivisiID']);
    });

    var users = sheetToObjects(usersSheet).sort(function (a, b) {
      return _cellStr(a['Nama']).localeCompare(_cellStr(b['Nama']));
    }).map(function (u) {
      return {
        userId:      _cellStr(u['UserID']),
        nama:        _cellStr(u['Nama']),
        email:       _cellStr(u['Email']),
        nip:         _cellStr(u['NIP']),
        role:        _cellStr(u['Role']),
        divisiId:    _cellStr(u['DivisiID']),
        namaDivisi:  u['DivisiID'] ? (namaDivisi[_cellStr(u['DivisiID'])] || _cellStr(u['DivisiID'])) : '\u2014',
        status:      _cellStr(u['Status']),
        registeredAt: _cellStr(u['RegisteredAt']),
        approvedAt:  _cellStr(u['ApprovedAt'])
      };
    });

    return { success: true, data: users };
  } catch (e) {
    Logger.log('[admin_getUsers] ' + e.message + '\n' + (e.stack || ''));
    return { success: false, error: e.message };
  }
}


/**
 * Ubah role / divisi / status satu pengguna. Field yang tidak dikirim tidak diubah.
 * Hanya SUPERADMIN. Dicatat di Audit_Log (Aksi UPDATE).
 *
 * @param {string} token
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.role]      - enum(SUPERADMIN, DIREKTUR, KADIV, STAF)
 * @param {string} [params.divisiId]  - diabaikan/dikosongkan utk SUPERADMIN & DIREKTUR
 * @param {string} [params.status]    - enum(APPROVED, REJECTED, NONAKTIF) — PENDING
 *                                      tidak diizinkan dari Admin (bukan state kelolaan)
 */
function admin_updateUser(token, params) {
  try {
    return withLock(function () {
      var session        = _requireSession(token);
      assertScope(session, [ROLE.SUPERADMIN], null);

      params = params || {};
      var userId      = String(params.userId || '').trim();
      var role        = params.role;
      var divisiId    = params.divisiId;
      var status      = params.status;

      if (!userId) return { success: false, error: 'UserID wajib diisi.' };

      // User yang sedang login tidak bisa mengubah dirinya sendiri.
      if (String(userId) === String(session.userId)) {
        return { success: false, error: 'Anda tidak bisa mengubah akun sendiri. Gunakan akun SUPERADMIN lain.' };
      }

      var usersSheet = openMasterSheet(SHEET_MASTER.USERS);
      var found = findRowByField(usersSheet, 'UserID', userId);
      if (!found) return { success: false, error: 'Pengguna tidak ditemukan.' };
      var cur = found.obj;

      var updates = {};
      var changes = [];

      // ── Role ─────────────────────────────────────────────
      var newRole = (role === undefined || role === null || String(role) === '') ? cur['Role'] : String(role);
      if (newRole !== cur['Role']) {
        var roleOk = [ROLE.SUPERADMIN, ROLE.DIREKTUR, ROLE.KADIV, ROLE.STAF].indexOf(newRole) !== -1;
        if (!roleOk) return { success: false, error: 'Role tidak valid.' };
        changes.push('Role ' + cur['Role'] + '→' + newRole);
        updates['Role'] = newRole;
      }

      // ── Divisi ───────────────────────────────────────────
      var isDirektif = (newRole === ROLE.SUPERADMIN || newRole === ROLE.DIREKTUR);
      var newDivisi = '';
      if (!isDirektif) {
        newDivisi = (divisiId === undefined || divisiId === null) ? String(cur['DivisiID'] || '') : String(divisiId).trim();
        if (!newDivisi) return { success: false, error: 'Divisi wajib diisi untuk role KADIV/STAF.' };
        var dvFound = findRowByField(openMasterSheet(SHEET_MASTER.DIVISI), 'DivisiID', newDivisi);
        if (!dvFound) return { success: false, error: 'Divisi tidak ditemukan.' };
      }
      if (String(newDivisi) !== String(cur['DivisiID'] || '')) {
        changes.push('Divisi ' + (cur['DivisiID'] || '—') + '→' + (newDivisi || 'lintas'));
        updates['DivisiID'] = newDivisi;
      }

      // ── Status ───────────────────────────────────────────
      var newStatus = (status === undefined || status === null || String(status) === '') ? cur['Status'] : String(status);
      if (newStatus !== cur['Status']) {
        var statusOk = [USER_STATUS.APPROVED, USER_STATUS.REJECTED, USER_STATUS.NONAKTIF].indexOf(newStatus) !== -1;
        if (!statusOk) return { success: false, error: 'Status tidak valid untuk kelola langsung.' };
        changes.push('Status ' + cur['Status'] + '→' + newStatus);
        updates['Status'] = newStatus;
        if (newStatus === USER_STATUS.APPROVED && cur['Status'] !== USER_STATUS.APPROVED) {
          updates['ApprovedAt'] = new Date();
          updates['ApprovedBy'] = session.userId;
        }
      }

      // ── Pengaman lockout: SUPERADMIN aktif terakhir ──────
      if (cur['Role'] === ROLE.SUPERADMIN && cur['Status'] === USER_STATUS.APPROVED) {
        var stillSuper = (updates['Role'] === undefined || updates['Role'] === ROLE.SUPERADMIN) &&
                         (updates['Status'] === undefined || updates['Status'] === USER_STATUS.APPROVED);
        if (!stillSuper) {
          var activeSupers = sheetToObjects(usersSheet).filter(function (u) {
            return u['Role'] === ROLE.SUPERADMIN && u['Status'] === USER_STATUS.APPROVED;
          });
          if (activeSupers.length <= 1) {
            return { success: false, error: 'Tidak bisa memodifikasi SUPERADMIN aktif terakhir (mencegah terkunci).' };
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return { success: true, data: { changed: false, message: 'Tidak ada perubahan.' } };
      }

      // Approval: pencairan akun NONAKTIF/REJECTED langsung→APPROVED oleh
      // Superadmin sah (bukan lewat queue).
      updateRowCells(usersSheet, found.rowIndex, updates);

      // Jika status berubah ke APPROVED atau REJECTED, sinkronkan Approval_Queue jika ada entri pending
      if (newStatus === USER_STATUS.APPROVED || newStatus === USER_STATUS.REJECTED) {
        try {
          var queueSheet = openLogSheet(SHEET_LOG.APPROVAL_QUEUE);
          var qRow = findRowByField(queueSheet, 'UserID', userId);
          if (qRow && String(qRow.obj['Status']) === USER_STATUS.PENDING) {
            updateRowCells(queueSheet, qRow.rowIndex, {
              'Status': newStatus,
              'DecidedBy': session.userId,
              'DecidedAt': new Date(),
              'AlasanReject': newStatus === USER_STATUS.REJECTED ? 'Ditolak langsung oleh Superadmin via Admin Panel' : ''
            });
          }
        } catch (qe) {
          Logger.log('[admin_updateUser] Sync Approval_Queue gagal: ' + qe.message);
        }
      }

      // Cabut sesi lama: role/divisi/status baru harus berlaku setelah login ulang,
      // jangan sampai token lama tetap memegang hak akses usang.
      _revokeUserSessions(userId);
      _auditLog(session.userId, 'UPDATE', SHEET_MASTER.USERS, userId,
        'Ubah akun oleh SUPERADMIN: ' + changes.join('; '));

      var updated = findRowByField(usersSheet, 'UserID', userId);
      var obj = updated ? updated.obj : cur;
      return {
        success: true,
        data: {
          changed: true,
          changes: changes,
          user: {
            userId: obj['UserID'], nama: obj['Nama'], email: obj['Email'],
            role: obj['Role'], divisiId: obj['DivisiID'], status: obj['Status']
          }
        }
      };
    });
  } catch (e) {
    Logger.log('[admin_updateUser] ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Reset password pengguna. Hanya SUPERADMIN. Dicatat di Audit_Log.
 *
 * @param {string} token
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.newPassword - min 8 karakter
 */
function admin_resetPassword(token, params) {
  try {
    return withLock(function () {
      var session  = _requireSession(token);
      assertScope(session, [ROLE.SUPERADMIN], null);

      params = params || {};
      var userId      = String(params.userId || '').trim();
      var newPassword = String(params.newPassword || '');

      if (!userId) return { success: false, error: 'UserID wajib diisi.' };
      if (newPassword.length < 8) {
        return { success: false, error: 'Password minimal 8 karakter.' };
      }

      var usersSheet = openMasterSheet(SHEET_MASTER.USERS);
      var found = findRowByField(usersSheet, 'UserID', userId);
      if (!found) return { success: false, error: 'Pengguna tidak ditemukan.' };

      updateRowCells(usersSheet, found.rowIndex, { 'PasswordHash': hashPassword(newPassword) });
      // Password berubah → seluruh sesi lama harus mati, selain memberitahu reset.
      _revokeUserSessions(userId);
      _auditLog(session.userId, 'UPDATE', SHEET_MASTER.USERS, userId,
        'Reset password oleh SUPERADMIN.');

      return { success: true, data: { userId: userId } };
    });
  } catch (e) {
    Logger.log('[admin_resetPassword] ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Audit log (baca saja). Hanya SUPERADMIN. Terbaru di atas; dibatasi limit.
 *
 * @param {string} token
 * @param {Object} [params]
 * @param {number} [params.limit] - default 300, maks 1000
 */
function admin_getAuditLog(token, params) {
  try {
    var session = _requireSession(token);
    assertScope(session, [ROLE.SUPERADMIN], null);

    params = params || {};
    var limit = parseInt(params.limit, 10);
    if (!(limit > 0)) limit = 300;
    if (limit > 1000) limit = 1000;

    var usersSheet = openMasterSheet(SHEET_MASTER.USERS);
    var namaMap = {};
    var roleMap = {};
    sheetToObjects(usersSheet).forEach(function (u) {
      namaMap[String(u['UserID'])] = u['Nama'] || '?';
      roleMap[String(u['UserID'])] = u['Role'] || '';
    });

    function _cellStr(v) {
      if (v === null || v === undefined || v === '') return '';
      if (v instanceof Date) return v.toISOString();
      return String(v);
    }

    var rows = sheetToObjects(openLogSheet(SHEET_LOG.AUDIT_LOG))
      .sort(function (a, b) {
        return (new Date(b['Timestamp']) - new Date(a['Timestamp']));
      })
      .slice(0, limit)
      .map(function (r) {
        return {
          logId:      _cellStr(r['LogID']),
          aksi:       _cellStr(r['Aksi']),
          sheetTarget:_cellStr(r['SheetTarget']),
          rowIdTarget:_cellStr(r['RowIDTarget']),
          alasan:     _cellStr(r['Alasan']),
          timestamp:  _cellStr(r['Timestamp']),
          userId:     _cellStr(r['UserID']),
          userName:   _cellStr(namaMap[String(r['UserID'])] || '—'),
          userRole:   _cellStr(roleMap[String(r['UserID'])] || '')
        };
      });

    return { success: true, data: rows };
  } catch (e) {
    Logger.log('[admin_getAuditLog] ' + e.message);
    return { success: false, error: e.message };
  }
}

// ===========================================================================
// KONFIGURASI KONEKTOR SATELIT & DATA MART (Fase 7 — SUPERADMIN ONLY)
// ===========================================================================

function _adnSatelliteDefs() {
  return [
    { key: PROP_KEY.SIKAP_SS_ID, fallbackKey: PROP_KEY.TU_SS_ID, label: 'SIKAP — Tata Usaha & BMN', category: 'SATELLITE' },
    { key: PROP_KEY.NAKHODA_SS_ID, fallbackKey: PROP_KEY.AWAK_SS_ID, label: 'Nakhoda — Pengawakan & Sijil', category: 'SATELLITE' },
    { key: PROP_KEY.SISTIK_SS_ID, fallbackKey: null, label: 'Sistik — Logistik & BBM', category: 'SATELLITE' },
    { key: PROP_KEY.SIAGA_SS_ID, fallbackKey: null, label: 'Siaga — Pemeliharaan & Galangan', category: 'SATELLITE' },
    { key: PROP_KEY.OPERASI_SS_ID, fallbackKey: null, label: 'Operasi & Pemantauan Armada', category: 'SATELLITE' },
    { key: PROP_KEY.LOOKER_MART_SS_ID, fallbackKey: null, label: 'Looker Studio — Data Mart Nasional', category: 'MART' }
  ];
}

function _adnExtractSpreadsheetId(raw) {
  var s = String(raw === undefined || raw === null ? '' : raw).trim();
  if (!s) return '';
  var m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) return s;
  throw new Error('Format ID atau tautan Google Spreadsheet tidak valid: "' + s.substring(0, 40) + '".');
}

function _adnBuildSatelliteStatus(props) {
  return _adnSatelliteDefs().map(function (def) {
    var primary = String(props.getProperty(def.key) || '').trim();
    var fallback = def.fallbackKey ? String(props.getProperty(def.fallbackKey) || '').trim() : '';
    var ssId = primary || fallback;
    var connected = false;
    var spreadsheetName = '';
    var error = ssId ? null : 'Belum dikonfigurasi';

    if (ssId) {
      try {
        var ss = _openSsCached(ssId);
        if (ss) {
          connected = true;
          spreadsheetName = typeof ss.getName === 'function' ? String(ss.getName() || '') : '';
        } else {
          error = 'Spreadsheet tidak dapat dibuka';
        }
      } catch (eOpen) {
        error = eOpen.message;
      }
    }

    return {
      key: def.key,
      label: def.label,
      category: def.category,
      ssId: ssId,
      connected: connected,
      spreadsheetName: spreadsheetName,
      error: error
    };
  });
}

function _adnGetLookerStateSnapshot(props) {
  if (typeof _lookerTriggerState === 'function') {
    return _lookerTriggerState();
  }
  return {
    aktif: !!props.getProperty(PROP_KEY.LOOKER_TRIGGER_ID),
    jadwal: 'Setiap hari 06:00 WIB',
    lookerMartId: props.getProperty(PROP_KEY.LOOKER_MART_SS_ID) || null,
    lastSyncedAt: props.getProperty(PROP_KEY.LOOKER_MART_LAST_SYNC) || null
  };
}

/**
 * Ambil konfigurasi & status konektivitas 5 satelit + Data Mart Looker Studio.
 * Hanya SUPERADMIN.
 *
 * @param {string} token
 */
function admin_getSatelliteConfig(token) {
  try {
    var session = _requireSession(token);
    assertScope(session, [ROLE.SUPERADMIN], null);

    var props = PropertiesService.getScriptProperties();
    var ids = getSpreadsheetIds();
    return {
      success: true,
      data: {
        pusatId: ids.pusatId || '',
        items: _adnBuildSatelliteStatus(props),
        lookerTrigger: _adnGetLookerStateSnapshot(props)
      }
    };
  } catch (e) {
    Logger.log('[admin_getSatelliteConfig] ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Simpan pembaruan Script Properties konektor satelit & Data Mart Looker Studio.
 * Hanya SUPERADMIN. Invalidasi cache aggregator bila ada perubahan.
 *
 * @param {string} token
 * @param {Object} params - map PROP_KEY -> Spreadsheet ID / URL (kosong = hapus koneksi)
 */
function admin_saveSatelliteConfig(token, params) {
  try {
    return withLock(function () {
      var session = _requireSession(token);
      assertScope(session, [ROLE.SUPERADMIN], null);

      var p = params || {};
      var props = PropertiesService.getScriptProperties();
      var defs = _adnSatelliteDefs();
      var updatedKeys = [];

      for (var i = 0; i < defs.length; i++) {
        var def = defs[i];
        if (!Object.prototype.hasOwnProperty.call(p, def.key)) continue;

        var normalized = _adnExtractSpreadsheetId(p[def.key]);
        var prev = String(props.getProperty(def.key) || '').trim();
        var prevFallback = def.fallbackKey ? String(props.getProperty(def.fallbackKey) || '').trim() : '';

        if (normalized) {
          if (normalized !== prev) {
            props.setProperty(def.key, normalized);
            updatedKeys.push(def.key);
          }
        } else {
          if (prev || prevFallback) {
            props.deleteProperty(def.key);
            if (def.fallbackKey && prevFallback) props.deleteProperty(def.fallbackKey);
            updatedKeys.push(def.key);
          }
        }
      }

      if (updatedKeys.length > 0) {
        if (typeof _aggBumpVersion === 'function') _aggBumpVersion();
        try { bumpTxVersion('SATELLITE_CONFIG'); } catch (eBump) {}
        _auditLog(
          session.userId,
          'UPDATE',
          'SYSTEM_SATELLITES',
          'CONNECTOR_CONFIG',
          'Pembaruan konfigurasi satelit: ' + updatedKeys.join(', ')
        );
      }

      return {
        success: true,
        data: {
          changed: updatedKeys.length > 0,
          updatedKeys: updatedKeys,
          items: _adnBuildSatelliteStatus(props),
          lookerTrigger: _adnGetLookerStateSnapshot(props)
        }
      };
    });
  } catch (e) {
    Logger.log('[admin_saveSatelliteConfig] ' + e.message);
    return { success: false, error: e.message };
  }
}
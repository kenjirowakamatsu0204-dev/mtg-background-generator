/* google.js
 * Small wrapper for Google APIs. Replace the mock functions with real calls.
 * - listDriveImages: return array of {id, thumbUrl, fullUrl}
 * - fetchPeopleFromSheet: return array of user rows
 * This file is OPTIONAL for local demo; app.js uses mocks if these fail.
 */

const GoogleAPI = (function(){
  const CONFIG = {
    // TODO: set your values if you wire live APIs
    DRIVE_FOLDER_ID: 'YOUR_FOLDER_ID',
    SHEET_ID: 'YOUR_SHEET_ID',
    SHEET_RANGE: 'Users!A:E', // A:JP name, B:EN name, C:Title, D:Email, E:Company
  };

  async function init(){ /* Load gapi + auth if you need it */ }

  // -------- MOCKS (works offline) --------
  async function listDriveImages(){
    // Use a few sample wallpapers (you can replace with Drive file webContentLinks)
    return [
      {id:'sample-1', thumbUrl:'assets/sample1.jpg', fullUrl:'assets/sample1.jpg'},
      {id:'sample-2', thumbUrl:'assets/sample2.jpg', fullUrl:'assets/sample2.jpg'},
      {id:'sample-3', thumbUrl:'assets/sample3.jpg', fullUrl:'assets/sample3.jpg'},
      {id:'sample-4', thumbUrl:'assets/sample4.jpg', fullUrl:'assets/sample4.jpg'},
      {id:'sample-5', thumbUrl:'assets/sample5.jpg', fullUrl:'assets/sample5.jpg'},
    ];
  }

  async function fetchPeopleFromSheet(){
    // Replace with live Sheets API read; this is a demo set.
    return [
      { jpName:'若松 太郎', enName:'Taro Wakamatsu', title:'PdM Consultant', email:'Taro.Wakamatsu@pendozer.com', company:'Pendozer 株式会社' },
      { jpName:'渡辺 ゆうた',   enName:'Yuta Watanabe',  title:'Solution Consultant', email:'yuta.watanabe@example.com', company:'Pendozer Japan 株式会社' },
      { jpName:'山田 太郎', enName:'Taro Yamada',       title:'Sales Engineer', email:'taro@example.com', company:'Pendozer 株式会社' },
    ];
  }

  // -------- REAL (template hints) --------
  /* Example outline if you enable live calls:
  async function listDriveImages(){
     await init();
     const res = await gapi.client.drive.files.list({
       q: `'${CONFIG.DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed=false`,
       fields: 'files(id,name,thumbnailLink,webContentLink,webViewLink)'
     });
     return res.result.files.map(f => ({
       id: f.id,
       thumbUrl: f.thumbnailLink,
       fullUrl: `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`
     }));
  }

  async function fetchPeopleFromSheet(){
     await init();
     const res = await gapi.client.sheets.spreadsheets.values.get({
       spreadsheetId: CONFIG.SHEET_ID, range: CONFIG.SHEET_RANGE
     });
     return res.result.values.slice(1).map(r => ({
       jpName:r[0]||'', enName:r[1]||'', title:r[2]||'', email:r[3]||'', company:r[4]||''
     }));
  }
  */

  return { listDriveImages, fetchPeopleFromSheet };
})();

const XLSX = require('xlsx');

const data = [{ 'S.No': 1, 'Name': 'Test' }];
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

try {
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  console.log('Buffer created successfully, length:', buffer.length);
} catch (e) {
  console.error('Error creating buffer:', e);
}

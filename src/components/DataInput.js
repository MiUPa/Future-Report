import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Tooltip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ja from 'date-fns/locale/ja';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';

function DataInput({ categories, salesData, setSalesData }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const fileInputRef = useRef(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');

  // すべてのカテゴリーのデータを統合して表形式に変換
  useEffect(() => {
    const allData = [];
    
    // すべてのカテゴリーのデータを1つの配列に統合
    Object.entries(salesData).forEach(([category, categoryData]) => {
      Object.entries(categoryData).forEach(([date, qty]) => {
        allData.push({
          id: `${category}-${date}`,
          category,
          date,
          quantity: qty
        });
      });
    });
    
    // データをソート
    const sortedData = sortData(allData, sortField, sortDirection);
    
    // フィルタリング
    const filteredData = filterCategory === 'all' 
      ? sortedData 
      : sortedData.filter(item => item.category === filterCategory);
    
    setTableData(filteredData);
  }, [salesData, filterCategory, sortField, sortDirection]);

  // データのソート関数
  const sortData = (data, field, direction) => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      
      if (field === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (field === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (field === 'quantity') {
        comparison = a.quantity - b.quantity;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  // ソート方向を切り替える
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddData = () => {
    try {
      if (selectedCategory && selectedDate && quantity) {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const parsedQuantity = parseInt(quantity, 10);
        
        if (isNaN(parsedQuantity)) {
          setError('数量は有効な数値である必要があります');
          return;
        }
        
        // 編集モードの場合は古いデータを削除
        if (editMode && editId) {
          // 編集前のカテゴリーと日付を取得
          const [oldCategory, oldDate] = editId.split('-');
          
          // 古いデータを削除
          const newSalesData = { ...salesData };
          if (newSalesData[oldCategory] && newSalesData[oldCategory][oldDate]) {
            delete newSalesData[oldCategory][oldDate];
            
            // カテゴリーが空になった場合は削除
            if (Object.keys(newSalesData[oldCategory]).length === 0) {
              delete newSalesData[oldCategory];
            }
          }
          
          // 新しいデータを追加
          if (!newSalesData[selectedCategory]) {
            newSalesData[selectedCategory] = {};
          }
          
          newSalesData[selectedCategory][dateKey] = parsedQuantity;
          
          setSalesData(newSalesData);
          setEditMode(false);
          setEditId(null);
          setEditCategory('');
          setSuccess('データを更新しました');
        } else {
          // 新規追加
          setSalesData({
            ...salesData,
            [selectedCategory]: {
              ...(salesData[selectedCategory] || {}),
              [dateKey]: parsedQuantity
            }
          });
          setSuccess('データを追加しました');
        }
        
        setQuantity('');
        setSelectedDate(null);
        setError(null);
        setTabValue(1); // データ追加後にテーブルタブに切り替え
      }
    } catch (error) {
      console.error('データ追加エラー:', error);
      setError('データの追加中にエラーが発生しました');
    }
  };

  const handleEdit = (category, date, qty) => {
    setEditMode(true);
    setEditId(`${category}-${date}`);
    setEditCategory(category);
    setSelectedCategory(category);
    setSelectedDate(new Date(date));
    setQuantity(qty.toString());
    setTabValue(0); // 入力フォームタブに切り替え
  };

  const handleDelete = (category, date) => {
    try {
      if (salesData[category] && salesData[category][date]) {
        const newSalesData = { ...salesData };
        delete newSalesData[category][date];
        
        // カテゴリーが空になった場合は削除
        if (Object.keys(newSalesData[category]).length === 0) {
          delete newSalesData[category];
        }
        
        setSalesData(newSalesData);
        setSuccess('データを削除しました');
      }
    } catch (error) {
      console.error('データ削除エラー:', error);
      setError('データの削除中にエラーが発生しました');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditId(null);
    setEditCategory('');
    setQuantity('');
    setSelectedDate(null);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // CSVデータをエクスポート
  const handleExportCSV = () => {
    try {
      if (tableData.length === 0) {
        setError('エクスポートするデータがありません');
        return;
      }

      const csvData = tableData.map(row => `${row.category},${row.date},${row.quantity}`).join('\n');
      const csvContent = `category,date,quantity\n${csvData}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sales_data.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('データをエクスポートしました');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      setError('データのエクスポート中にエラーが発生しました');
    }
  };

  // JSONデータをエクスポート
  const handleExportJSON = () => {
    try {
      if (Object.keys(salesData).length === 0) {
        setError('エクスポートするデータがありません');
        return;
      }

      const jsonData = JSON.stringify(salesData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sales_data.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('データをエクスポートしました');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      setError('データのエクスポート中にエラーが発生しました');
    }
  };

  // インポートダイアログを開く
  const handleOpenImportDialog = () => {
    setImportData('');
    setImportDialogOpen(true);
  };

  // ファイル選択ダイアログを開く
  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  // ファイルからデータを読み込む
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImportData(e.target.result);
    };
    reader.readAsText(file);
    
    // ファイル入力をリセット
    event.target.value = null;
  };

  // データをインポート
  const handleImportData = () => {
    try {
      if (!importData) {
        setError('インポートするデータがありません');
        return;
      }

      let newSalesData = { ...salesData };
      
      // JSONかCSVかを判断
      if (importData.trim().startsWith('{')) {
        // JSONデータ
        const importedData = JSON.parse(importData);
        newSalesData = { ...newSalesData, ...importedData };
      } else {
        // CSVデータ
        const lines = importData.trim().split('\n');
        const headers = lines[0].split(',');
        
        // ヘッダーの検証
        if (headers.length < 3 || 
            !headers.includes('category') || 
            !headers.includes('date') || 
            !headers.includes('quantity')) {
          setError('CSVフォーマットが正しくありません。category,date,quantityの列が必要です');
          return;
        }
        
        const categoryIndex = headers.indexOf('category');
        const dateIndex = headers.indexOf('date');
        const quantityIndex = headers.indexOf('quantity');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 3) {
            const category = values[categoryIndex].trim();
            const date = values[dateIndex].trim();
            const quantity = parseInt(values[quantityIndex].trim(), 10);
            
            if (!isNaN(quantity) && category && date) {
              if (!newSalesData[category]) {
                newSalesData[category] = {};
              }
              newSalesData[category][date] = quantity;
            }
          }
        }
      }
      
      setSalesData(newSalesData);
      setImportDialogOpen(false);
      setSuccess('データをインポートしました');
    } catch (error) {
      console.error('インポートエラー:', error);
      setError('データのインポート中にエラーが発生しました');
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        販売データ管理
      </Typography>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleOpenImportDialog}
            >
              インポート
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCSV}
              disabled={tableData.length === 0}
            >
              CSV出力
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportJSON}
              disabled={Object.keys(salesData).length === 0}
            >
              JSON出力
            </Button>
          </Box>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="データ入力" />
          <Tab label="データ一覧" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>カテゴリー</InputLabel>
                <Select
                  value={selectedCategory}
                  label="カテゴリー"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                <DatePicker
                  label="日付"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <TextField
                label="数量"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                onClick={handleAddData}
                disabled={!selectedCategory || !selectedDate || !quantity}
                fullWidth
                sx={{ height: '100%' }}
              >
                {editMode ? 'データを更新' : 'データを追加'}
              </Button>
            </Grid>
            
            {editMode && (
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  fullWidth
                  sx={{ height: '100%' }}
                >
                  キャンセル
                </Button>
              </Grid>
            )}
          </Grid>
        )}

        {tabValue === 1 && (
          <>
            <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>カテゴリーフィルター</InputLabel>
                <Select
                  value={filterCategory}
                  label="カテゴリーフィルター"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">すべて表示</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      onClick={() => toggleSort('category')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        カテゴリー
                        <Tooltip title={`${sortField === 'category' ? (sortDirection === 'asc' ? '昇順' : '降順') : '昇順'}`}>
                          <SortIcon 
                            fontSize="small" 
                            color={sortField === 'category' ? 'primary' : 'disabled'}
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => toggleSort('date')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        日付
                        <Tooltip title={`${sortField === 'date' ? (sortDirection === 'asc' ? '昇順' : '降順') : '昇順'}`}>
                          <SortIcon 
                            fontSize="small" 
                            color={sortField === 'date' ? 'primary' : 'disabled'}
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell 
                      align="right"
                      onClick={() => toggleSort('quantity')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        数量
                        <Tooltip title={`${sortField === 'quantity' ? (sortDirection === 'asc' ? '昇順' : '降順') : '昇順'}`}>
                          <SortIcon 
                            fontSize="small" 
                            color={sortField === 'quantity' ? 'primary' : 'disabled'}
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.length > 0 ? (
                    tableData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Chip label={row.category} size="small" />
                        </TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit(row.category, row.date, row.quantity)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(row.category, row.date)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        データがありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
      
      {/* エラーメッセージ */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      {/* 成功メッセージ */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      {/* インポートダイアログ */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>データインポート</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            CSVまたはJSONフォーマットのデータをインポートします。
            <br />
            CSVの場合は「category,date,quantity」の形式が必要です。
          </DialogContentText>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleFileSelect}
              startIcon={<FileUploadIcon />}
            >
              ファイルを選択
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.json"
              style={{ display: 'none' }}
            />
          </Box>
          
          <TextField
            label="データ"
            multiline
            rows={10}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            fullWidth
            placeholder="ここにCSVまたはJSONデータを貼り付けるか、ファイルを選択してください"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={handleImportData} 
            variant="contained"
            disabled={!importData.trim()}
          >
            インポート
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DataInput; 
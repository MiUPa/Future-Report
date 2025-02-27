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
  DialogTitle
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ja from 'date-fns/locale/ja';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';

function DataInput({ categories, salesData, setSalesData }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [filteredData, setFilteredData] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const fileInputRef = useRef(null);

  // 選択されたカテゴリーのデータを表形式に変換
  useEffect(() => {
    if (selectedCategory && salesData[selectedCategory]) {
      const tableData = Object.entries(salesData[selectedCategory]).map(([date, qty]) => ({
        id: date,
        date,
        quantity: qty
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setFilteredData(tableData);
    } else {
      setFilteredData([]);
    }
  }, [selectedCategory, salesData]);

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
          const newCategoryData = { ...salesData[selectedCategory] };
          delete newCategoryData[editId];
          
          setSalesData({
            ...salesData,
            [selectedCategory]: {
              ...newCategoryData,
              [dateKey]: parsedQuantity
            }
          });
          
          setEditMode(false);
          setEditId(null);
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

  const handleEdit = (date, qty) => {
    setEditMode(true);
    setEditId(date);
    setSelectedDate(new Date(date));
    setQuantity(qty.toString());
    setTabValue(0); // 入力フォームタブに切り替え
  };

  const handleDelete = (date) => {
    try {
      if (selectedCategory && salesData[selectedCategory]) {
        const newCategoryData = { ...salesData[selectedCategory] };
        delete newCategoryData[date];
        
        setSalesData({
          ...salesData,
          [selectedCategory]: newCategoryData
        });
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
      if (!selectedCategory || !salesData[selectedCategory]) {
        setError('エクスポートするデータがありません');
        return;
      }

      const csvData = filteredData.map(row => `${row.date},${row.quantity}`).join('\n');
      const csvContent = `date,quantity\n${csvData}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedCategory}_data.csv`);
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
      if (!selectedCategory || !salesData[selectedCategory]) {
        setError('エクスポートするデータがありません');
        return;
      }

      const jsonData = JSON.stringify(salesData[selectedCategory], null, 2);
      const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedCategory}_data.json`);
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
    if (!selectedCategory) {
      setError('先にカテゴリーを選択してください');
      return;
    }
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
      if (!selectedCategory || !importData) {
        setError('インポートするデータがありません');
        return;
      }

      let importedData = {};
      
      // JSONかCSVかを判断
      if (importData.trim().startsWith('{')) {
        // JSONデータ
        importedData = JSON.parse(importData);
      } else {
        // CSVデータ
        const lines = importData.trim().split('\n');
        const headers = lines[0].split(',');
        
        // ヘッダーの検証
        if (headers.length < 2 || !headers.includes('date') || !headers.includes('quantity')) {
          setError('CSVフォーマットが正しくありません。date,quantityの列が必要です');
          return;
        }
        
        const dateIndex = headers.indexOf('date');
        const quantityIndex = headers.indexOf('quantity');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 2) {
            const date = values[dateIndex].trim();
            const quantity = parseInt(values[quantityIndex].trim(), 10);
            
            if (!isNaN(quantity) && date) {
              importedData[date] = quantity;
            }
          }
        }
      }
      
      // 既存データとマージ
      setSalesData({
        ...salesData,
        [selectedCategory]: {
          ...(salesData[selectedCategory] || {}),
          ...importedData
        }
      });
      
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
        <Grid container spacing={2} sx={{ mb: 2 }}>
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
          
          {selectedCategory && (
            <Grid item xs={12} sm={9}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
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
                  disabled={!filteredData.length}
                >
                  CSV出力
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportJSON}
                  disabled={!filteredData.length}
                >
                  JSON出力
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="データ入力" />
          <Tab label="データ一覧" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={2}>
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
            
            <Grid item xs={12} sm={3}>
              <TextField
                label="数量"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
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
              <Grid item xs={12} sm={3}>
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
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>日付</TableCell>
                  <TableCell align="right">数量</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell component="th" scope="row">
                        {row.date}
                      </TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(row.date, row.quantity)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(row.date)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      {selectedCategory ? 'データがありません' : 'カテゴリーを選択してください'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
            CSVの場合は「date,quantity」の形式が必要です。
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
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
  Tooltip,
  List,
  ListItem,
  ListItemText
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
import AddIcon from '@mui/icons-material/Add';

function DataInput({ categories, salesData, setSalesData, setCategories }) {
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
  const [previewData, setPreviewData] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [fileToProcess, setFileToProcess] = useState(null);
  const [fileType, setFileType] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

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
    setPreviewData([]);
    setPreviewHeaders([]);
    setPreviewMode(false);
    setFileToProcess(null);
    setFileType('');
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

    // ファイルサイズの制限（10MB）
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError(`ファイルサイズが大きすぎます（${Math.round(file.size / (1024 * 1024))}MB）。10MB以下のファイルを選択してください。`);
      event.target.value = null;
      return;
    }

    // ファイルタイプを設定
    const isJSON = file.name.toLowerCase().endsWith('.json');
    setFileType(isJSON ? 'json' : 'csv');
    
    // ファイルを読み込む
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (!e.target || !e.target.result) {
          throw new Error('ファイルの読み込みに失敗しました');
        }
        
        const fileContent = e.target.result.toString();
        setImportData(fileContent);
        
        // JSONファイルの場合
        if (isJSON) {
          // JSONデータを解析
          const jsonData = JSON.parse(fileContent);
          
          // プレビューデータの作成
          const previewRows = [];
          let count = 0;
          
          // JSONデータから最初の数件を抽出
          for (const category in jsonData) {
            for (const date in jsonData[category]) {
              if (count < 10) { // 最初の10件のみ表示
                previewRows.push({
                  category,
                  date,
                  quantity: jsonData[category][date]
                });
                count++;
              } else {
                break;
              }
            }
            if (count >= 10) break;
          }
          
          setPreviewHeaders(['category', 'date', 'quantity']);
          setPreviewData(previewRows);
        } 
        // CSVファイルの場合
        else {
          // CSVデータを行に分割
          const lines = fileContent.split('\n');
          if (lines.length > 0) {
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            setPreviewHeaders(headers);
            
            // ヘッダーの検証と列インデックスの特定
            const categoryIndex = headers.indexOf('category');
            const dateIndex = headers.indexOf('date');
            const quantityIndex = headers.findIndex(h => h === 'quantity' || h === 'sales');
            
            if (categoryIndex !== -1 && dateIndex !== -1 && quantityIndex !== -1) {
              const previewRows = [];
              
              // 最初の10行（ヘッダー行を除く）をプレビュー
              for (let i = 1; i < Math.min(lines.length, 11); i++) {
                if (!lines[i].trim()) continue;
                
                const values = lines[i].split(',');
                if (values.length >= Math.max(categoryIndex, dateIndex, quantityIndex) + 1) {
                  previewRows.push({
                    category: values[categoryIndex].trim(),
                    date: values[dateIndex].trim(),
                    quantity: values[quantityIndex].trim()
                  });
                }
              }
              
              setPreviewData(previewRows);
            } else {
              throw new Error('CSVフォーマットが正しくありません。category, date, quantity/sales の列が必要です');
            }
          }
        }
        
        // プレビューモードに切り替え
        setPreviewMode(true);
      } catch (error) {
        console.error('ファイル読み込みエラー:', error);
        setError(`ファイルの読み込み中にエラーが発生しました: ${error.message}`);
        setPreviewData([]);
        setPreviewHeaders([]);
        setPreviewMode(false);
      }
    };
    
    reader.onerror = () => {
      setError('ファイルの読み込みに失敗しました');
    };
    
    reader.readAsText(file);
    
    // ファイル入力をリセット
    event.target.value = null;
  };

  // テキストエリアの内容が変更されたときのプレビュー生成
  const handleImportDataChange = (e) => {
    const data = e.target.value;
    setImportData(data);
    
    if (!data.trim()) {
      setPreviewData([]);
      setPreviewHeaders([]);
      setPreviewMode(false);
      return;
    }
    
    try {
      // JSONかCSVかを判断
      if (data.trim().startsWith('{')) {
        // JSONデータ
        setFileType('json');
        const jsonData = JSON.parse(data);
        
        // JSONプレビューデータの作成
        const previewRows = [];
        let count = 0;
        
        // JSONデータから最初の数件を抽出
        for (const category in jsonData) {
          for (const date in jsonData[category]) {
            if (count < 10) { // 最初の10件のみ表示
              previewRows.push({
                category,
                date,
                quantity: jsonData[category][date]
              });
              count++;
            } else {
              break;
            }
          }
          if (count >= 10) break;
        }
        
        setPreviewHeaders(['category', 'date', 'quantity']);
        setPreviewData(previewRows);
      } else {
        // CSVデータ
        setFileType('csv');
        const lines = data.trim().split('\n');
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          setPreviewHeaders(headers);
          
          // ヘッダーの検証と列インデックスの特定
          const categoryIndex = headers.findIndex(h => h === 'category');
          const dateIndex = headers.findIndex(h => h === 'date');
          const quantityIndex = headers.findIndex(h => h === 'quantity' || h === 'sales');
          
          if (categoryIndex !== -1 && dateIndex !== -1 && quantityIndex !== -1) {
            const previewRows = [];
            
            // 最初の10行（ヘッダー行を除く）をプレビュー
            for (let i = 1; i < Math.min(lines.length, 11); i++) {
              if (!lines[i].trim()) continue;
              
              const values = lines[i].split(',');
              if (values.length >= Math.max(categoryIndex, dateIndex, quantityIndex) + 1) {
                previewRows.push({
                  category: values[categoryIndex].trim(),
                  date: values[dateIndex].trim(),
                  quantity: values[quantityIndex].trim()
                });
              }
            }
            
            setPreviewData(previewRows);
          }
        }
      }
      
      // プレビューモードに切り替え
      setPreviewMode(true);
    } catch (error) {
      // エラーが発生した場合はプレビューをクリア
      setPreviewData([]);
      setPreviewHeaders([]);
      setPreviewMode(false);
    }
  };

  // データをインポート（プレビュー確認後）
  const handleImportData = () => {
    // バリデーション
    if (!previewMode || previewData.length === 0) {
      setError('インポートするデータがありません');
      return;
    }

    try {
      // 処理開始前にダイアログを閉じる
      setImportDialogOpen(false);
      
      // 新しい販売データオブジェクトを作成
      const newSalesData = { ...salesData };
      // 新しいカテゴリーを追跡するための配列
      const newCategoriesToAdd = [];
      
      // JSONデータの場合
      if (fileType === 'json') {
        try {
          // JSONデータを解析
          const jsonData = JSON.parse(importData);
          
          // 各カテゴリーのデータを処理
          Object.entries(jsonData).forEach(([category, dates]) => {
            if (typeof dates === 'object' && dates !== null) {
              // 新しいカテゴリーを検出
              if (!categories.includes(category) && !newCategoriesToAdd.includes(category)) {
                newCategoriesToAdd.push(category);
              }
              
              if (!newSalesData[category]) {
                newSalesData[category] = {};
              }
              
              // 各日付のデータを追加
              Object.entries(dates).forEach(([date, qty]) => {
                const quantity = parseInt(qty, 10);
                if (!isNaN(quantity)) {
                  newSalesData[category][date] = quantity;
                }
              });
            }
          });
          
          // 新しいカテゴリーを追加
          if (newCategoriesToAdd.length > 0) {
            setCategories([...categories, ...newCategoriesToAdd]);
          }
          
          // データを更新して成功メッセージを表示
          setSalesData(newSalesData);
          
          const categoryMessage = newCategoriesToAdd.length > 0 
            ? `（${newCategoriesToAdd.length}個の新しいカテゴリーを追加しました）` 
            : '';
          setSuccess(`JSONデータをインポートしました${categoryMessage}`);
        } catch (error) {
          console.error('JSONインポートエラー:', error);
          setError(`JSONデータの処理中にエラーが発生しました: ${error.message}`);
        }
      } 
      // CSVデータの場合
      else {
        try {
          // CSVデータを行に分割
          const lines = importData.trim().split('\n');
          if (lines.length <= 1) {
            setError('インポートするデータがありません');
            return;
          }
          
          // ヘッダー行を解析
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // 必要な列のインデックスを特定
          const categoryIndex = headers.indexOf('category');
          const dateIndex = headers.indexOf('date');
          const quantityIndex = headers.findIndex(h => h === 'quantity' || h === 'sales');
          
          // 必要な列が存在するか確認
          if (categoryIndex === -1 || dateIndex === -1 || quantityIndex === -1) {
            setError('CSVフォーマットが正しくありません。category, date, quantity/sales の列が必要です');
            return;
          }
          
          // 各行を処理
          let successCount = 0;
          let errorCount = 0;
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // 空行をスキップ
            
            try {
              const values = line.split(',');
              
              // 必要な値が存在するか確認
              if (values.length > Math.max(categoryIndex, dateIndex, quantityIndex)) {
                const category = values[categoryIndex].trim();
                const dateStr = values[dateIndex].trim();
                const quantityStr = values[quantityIndex].trim();
                
                // 数量を整数に変換
                const quantity = parseInt(quantityStr, 10);
                
                // 日付を標準形式に変換
                let formattedDate = dateStr;
                
                // スラッシュ区切りの日付を処理
                if (dateStr.includes('/')) {
                  const dateParts = dateStr.split('/');
                  if (dateParts.length === 3) {
                    if (dateParts[0].length === 4) {
                      // YYYY/MM/DD 形式
                      formattedDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
                    } else {
                      // MM/DD/YYYY 形式と仮定
                      formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
                    }
                  }
                }
                
                // 新しいカテゴリーを検出
                if (category && !categories.includes(category) && !newCategoriesToAdd.includes(category)) {
                  newCategoriesToAdd.push(category);
                }
                
                // データを追加
                if (!isNaN(quantity) && category && formattedDate) {
                  if (!newSalesData[category]) {
                    newSalesData[category] = {};
                  }
                  newSalesData[category][formattedDate] = quantity;
                  successCount++;
                } else {
                  errorCount++;
                }
              } else {
                errorCount++;
              }
            } catch (err) {
              console.error(`行 ${i} の処理中にエラー:`, err);
              errorCount++;
            }
          }
          
          // 新しいカテゴリーを追加
          if (newCategoriesToAdd.length > 0) {
            setCategories([...categories, ...newCategoriesToAdd]);
          }
          
          // データを更新して成功メッセージを表示
          setSalesData(newSalesData);
          
          if (successCount > 0) {
            const categoryMessage = newCategoriesToAdd.length > 0 
              ? `（${newCategoriesToAdd.length}個の新しいカテゴリーを追加しました）` 
              : '';
            setSuccess(`${successCount}件のデータをインポートしました${errorCount > 0 ? `（${errorCount}件の無効なデータはスキップされました）` : ''}${categoryMessage}`);
          } else {
            setError('有効なデータがインポートされませんでした');
          }
        } catch (error) {
          console.error('CSVインポートエラー:', error);
          setError(`CSVデータの処理中にエラーが発生しました: ${error.message}`);
        }
      }
      
      // インポート後に状態をリセット
      setImportData('');
      setPreviewData([]);
      setPreviewHeaders([]);
      setPreviewMode(false);
      setFileToProcess(null);
      setFileType('');
      
    } catch (error) {
      console.error('インポートエラー:', error);
      setError(`データのインポート中にエラーが発生しました: ${error.message}`);
    }
  };

  // カテゴリー管理ダイアログを開く
  const handleOpenCategoryDialog = () => {
    setNewCategory('');
    setCategoryDialogOpen(true);
  };

  // 新しいカテゴリーを追加
  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
      setSuccess('カテゴリーを追加しました');
    } else if (categories.includes(newCategory.trim())) {
      setError('同名のカテゴリーが既に存在します');
    } else {
      setError('カテゴリー名を入力してください');
    }
  };

  // カテゴリーを削除
  const handleDeleteCategory = (categoryToDelete) => {
    // カテゴリーに関連するデータがあるか確認
    const hasData = salesData[categoryToDelete] && Object.keys(salesData[categoryToDelete]).length > 0;
    
    if (hasData) {
      // 確認ダイアログを表示する代わりに警告メッセージを表示
      setError(`カテゴリー「${categoryToDelete}」には販売データが存在します。データを削除してからカテゴリーを削除してください。`);
      return;
    }
    
    // カテゴリーを削除
    setCategories(categories.filter(category => category !== categoryToDelete));
    
    // 関連するデータも削除（念のため）
    if (salesData[categoryToDelete]) {
      const newSalesData = { ...salesData };
      delete newSalesData[categoryToDelete];
      setSalesData(newSalesData);
    }
    
    setSuccess(`カテゴリー「${categoryToDelete}」を削除しました`);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        データ管理
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
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpenCategoryDialog}
            color="primary"
          >
            カテゴリー管理
          </Button>
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
      <Dialog 
        open={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
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
            rows={6}
            value={importData}
            onChange={handleImportDataChange}
            fullWidth
            placeholder="ここにCSVまたはJSONデータを貼り付けるか、ファイルを選択してください"
          />
          
          {/* プレビュー表示 */}
          {previewMode && previewData.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                データプレビュー（最初の{previewData.length}行）
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {fileType === 'json' || (
                        previewHeaders.includes('category') && 
                        previewHeaders.includes('date') && 
                        (previewHeaders.includes('quantity') || previewHeaders.includes('sales'))
                      ) ? (
                        <>
                          <TableCell>カテゴリー</TableCell>
                          <TableCell>日付</TableCell>
                          <TableCell>数量</TableCell>
                        </>
                      ) : (
                        previewHeaders.map((header, index) => (
                          <TableCell key={index}>{header}</TableCell>
                        ))
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {fileType === 'json' || (
                          previewHeaders.includes('category') && 
                          previewHeaders.includes('date') && 
                          (previewHeaders.includes('quantity') || previewHeaders.includes('sales'))
                        ) ? (
                          <>
                            <TableCell>{row.category}</TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.quantity}</TableCell>
                          </>
                        ) : (
                          previewHeaders.map((header, colIndex) => (
                            <TableCell key={`${rowIndex}-${colIndex}`}>
                              {row[header]}
                            </TableCell>
                          ))
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {fileType === 'csv' ? 'CSVデータ' : 'JSONデータ'}のプレビューです。実際のインポート時には日付形式の変換などが行われます。
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={handleImportData} 
            variant="contained"
            disabled={!previewMode || previewData.length === 0}
          >
            インポート
          </Button>
        </DialogActions>
      </Dialog>

      {/* カテゴリー管理ダイアログ */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
        <DialogTitle>カテゴリー管理</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
            <TextField
              label="新しいカテゴリー"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleAddCategory}
              disabled={!newCategory.trim()}
            >
              追加
            </Button>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>
            既存のカテゴリー
          </Typography>
          
          <List>
            {categories.map((category) => (
              <ListItem key={category} disablePadding>
                <ListItemText primary={category} />
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteCategory(category)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
            {categories.length === 0 && (
              <ListItem>
                <ListItemText primary="カテゴリーがありません" />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DataInput; 
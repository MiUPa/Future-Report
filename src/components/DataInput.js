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

    // ファイルサイズの制限（10MB）
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError(`ファイルサイズが大きすぎます（${Math.round(file.size / (1024 * 1024))}MB）。10MB以下のファイルを選択してください。`);
      event.target.value = null;
      return;
    }

    // 小さいファイルの場合は通常の方法で読み込む
    if (file.size < 1 * 1024 * 1024) { // 1MB未満
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportData(e.target.result);
      };
      reader.readAsText(file);
    } else {
      // 大きなファイルの場合は直接処理
      setImportDialogOpen(false);
      setSuccess('大きなファイルを処理しています。しばらくお待ちください...');
      
      // 非同期でファイル処理を開始
      setTimeout(() => {
        processLargeFile(file);
      }, 100);
    }
    
    // ファイル入力をリセット
    event.target.value = null;
  };

  // 大きなファイルを直接処理する関数
  const processLargeFile = (file) => {
    try {
      // CSVファイルかJSONファイルかを判断
      if (file.name.toLowerCase().endsWith('.json')) {
        // JSONファイルの場合
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            const newSalesData = { ...salesData, ...jsonData };
            setSalesData(newSalesData);
            setSuccess('JSONデータをインポートしました');
          } catch (error) {
            setError(`JSONデータの解析に失敗しました: ${error.message}`);
          }
        };
        reader.onerror = () => {
          setError('ファイルの読み込みに失敗しました');
        };
        reader.readAsText(file);
      } else {
        // CSVファイルの場合はストリーミング処理
        processCSVFileInChunks(file);
      }
    } catch (error) {
      console.error('ファイル処理エラー:', error);
      setError(`ファイルの処理中にエラーが発生しました: ${error.message}`);
    }
  };

  // CSVファイルをチャンクで処理する関数
  const processCSVFileInChunks = (file) => {
    const CHUNK_SIZE = 1024 * 1024; // 1MBずつ読み込む
    let offset = 0;
    let lineBuffer = '';
    let isFirstChunk = true;
    let headers = [];
    let categoryIndex = -1;
    let dateIndex = -1;
    let quantityIndex = -1;
    let newSalesData = { ...salesData };
    let successCount = 0;
    let errorCount = 0;
    let totalBytesRead = 0;

    // ファイルの一部を読み込む関数
    const readNextChunk = () => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target.result) {
          try {
            // 読み込んだチャンクを処理
            totalBytesRead += e.target.result.length;
            const progress = Math.min(100, Math.round((totalBytesRead / file.size) * 100));
            setSuccess(`ファイル読み込み中... ${progress}%`);
            
            // 前回の残りと今回のチャンクを結合
            const chunk = lineBuffer + e.target.result;
            
            // 完全な行に分割（最後の不完全な行は次のチャンクのために保存）
            const lines = chunk.split('\n');
            lineBuffer = lines.pop() || '';
            
            // 最初のチャンクの場合、ヘッダーを処理
            if (isFirstChunk) {
              isFirstChunk = false;
              headers = lines[0].split(',');
              
              // ヘッダーの検証と列インデックスの特定
              headers.forEach((header, index) => {
                const headerLower = header.toLowerCase().trim();
                if (headerLower === 'category') {
                  categoryIndex = index;
                } else if (headerLower === 'date') {
                  dateIndex = index;
                } else if (headerLower === 'quantity' || headerLower === 'sales') {
                  quantityIndex = index;
                }
              });
              
              if (categoryIndex === -1 || dateIndex === -1 || quantityIndex === -1) {
                throw new Error('CSVフォーマットが正しくありません。category, date, quantity/sales の列が必要です');
              }
              
              // ヘッダー行をスキップ
              lines.shift();
            }
            
            // 各行を処理
            for (const line of lines) {
              if (!line.trim()) continue; // 空行をスキップ
              
              try {
                const values = line.split(',');
                if (values.length >= Math.max(categoryIndex, dateIndex, quantityIndex) + 1) {
                  const category = values[categoryIndex].trim();
                  let dateStr = values[dateIndex].trim();
                  const quantity = parseInt(values[quantityIndex].trim(), 10);
                  
                  // 日付フォーマットの変換
                  let formattedDate;
                  if (dateStr.includes('/')) {
                    // YYYY/MM/DD または MM/DD/YYYY 形式を処理
                    const dateParts = dateStr.split('/');
                    if (dateParts.length === 3) {
                      if (dateParts[0].length === 4) {
                        // YYYY/MM/DD 形式
                        const year = parseInt(dateParts[0], 10);
                        const month = parseInt(dateParts[1], 10).toString().padStart(2, '0');
                        const day = parseInt(dateParts[2], 10).toString().padStart(2, '0');
                        formattedDate = `${year}-${month}-${day}`;
                      } else {
                        // MM/DD/YYYY または DD/MM/YYYY 形式と仮定
                        // ここでは MM/DD/YYYY と仮定
                        const year = parseInt(dateParts[2], 10);
                        const month = parseInt(dateParts[0], 10).toString().padStart(2, '0');
                        const day = parseInt(dateParts[1], 10).toString().padStart(2, '0');
                        formattedDate = `${year}-${month}-${day}`;
                      }
                    } else {
                      throw new Error(`不正な日付フォーマット: ${dateStr}`);
                    }
                  } else {
                    // すでに YYYY-MM-DD 形式と仮定
                    formattedDate = dateStr;
                  }
                  
                  if (!isNaN(quantity) && category && formattedDate) {
                    if (!newSalesData[category]) {
                      newSalesData[category] = {};
                    }
                    newSalesData[category][formattedDate] = quantity;
                    successCount++;
                    
                    // 1000件ごとに進捗を更新
                    if (successCount % 1000 === 0) {
                      setSuccess(`処理中... ${successCount}件のデータを処理しました`);
                    }
                  } else {
                    errorCount++;
                  }
                } else {
                  errorCount++;
                }
              } catch (err) {
                console.error(`行の処理中にエラー:`, err);
                errorCount++;
              }
            }
            
            // まだ読み込むデータがあれば次のチャンクを読み込む
            if (offset < file.size) {
              readNextChunk();
            } else {
              // 全てのチャンクを処理完了
              finishImport(newSalesData, successCount, errorCount);
            }
          } catch (error) {
            console.error('チャンク処理エラー:', error);
            setError(`データの処理中にエラーが発生しました: ${error.message}`);
          }
        }
      };
      
      reader.onerror = () => {
        setError('ファイルの読み込みに失敗しました');
      };
      
      // ファイルの一部を切り出して読み込む
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsText(slice);
      offset += CHUNK_SIZE;
    };
    
    // 最初のチャンクを読み込み開始
    readNextChunk();
  };

  // データをインポート（テキストエリアからの入力用）
  const handleImportData = () => {
    try {
      if (!importData) {
        setError('インポートするデータがありません');
        return;
      }

      // 処理開始前にダイアログを閉じる（UIをブロックしないため）
      setImportDialogOpen(false);
      setSuccess('インポート処理を開始しました。大きなデータの場合は時間がかかることがあります...');

      // 非同期処理でインポートを実行
      setTimeout(() => {
        processImportData();
      }, 100);
    } catch (error) {
      console.error('インポートエラー:', error);
      setError(`データのインポート中にエラーが発生しました: ${error.message}`);
    }
  };

  // インポートデータを実際に処理する関数
  const processImportData = () => {
    try {
      let newSalesData = { ...salesData };
      
      // JSONかCSVかを判断
      if (importData.trim().startsWith('{')) {
        // JSONデータ
        const importedData = JSON.parse(importData);
        newSalesData = { ...newSalesData, ...importedData };
        setSalesData(newSalesData);
        setSuccess('JSONデータをインポートしました');
      } else {
        // CSVデータ
        processCSVData(newSalesData);
      }
    } catch (error) {
      console.error('インポート処理エラー:', error);
      setError(`データの処理中にエラーが発生しました: ${error.message}`);
    }
  };

  // CSVデータを処理する関数
  const processCSVData = (newSalesData) => {
    try {
      const lines = importData.trim().split('\n');
      if (lines.length === 0) {
        setError('CSVデータが空です');
        return;
      }

      const headers = lines[0].split(',');
      
      // ヘッダーの検証と列インデックスの特定
      let categoryIndex = -1;
      let dateIndex = -1;
      let quantityIndex = -1;
      
      headers.forEach((header, index) => {
        const headerLower = header.toLowerCase().trim();
        if (headerLower === 'category') {
          categoryIndex = index;
        } else if (headerLower === 'date') {
          dateIndex = index;
        } else if (headerLower === 'quantity' || headerLower === 'sales') {
          quantityIndex = index;
        }
      });
      
      if (categoryIndex === -1 || dateIndex === -1 || quantityIndex === -1) {
        setError('CSVフォーマットが正しくありません。category, date, quantity/sales の列が必要です');
        return;
      }
      
      // 大きなファイルを処理するためのチャンク処理
      const chunkSize = 1000; // 一度に処理する行数
      let currentChunk = 0;
      let successCount = 0;
      let errorCount = 0;
      
      // チャンク処理関数
      const processChunk = () => {
        const startIdx = currentChunk * chunkSize + 1; // ヘッダー行をスキップ
        const endIdx = Math.min(startIdx + chunkSize, lines.length);
        
        for (let i = startIdx; i < endIdx; i++) {
          if (!lines[i].trim()) continue; // 空行をスキップ
          
          try {
            const values = lines[i].split(',');
            if (values.length >= Math.max(categoryIndex, dateIndex, quantityIndex) + 1) {
              const category = values[categoryIndex].trim();
              let dateStr = values[dateIndex].trim();
              const quantity = parseInt(values[quantityIndex].trim(), 10);
              
              // 日付フォーマットの変換
              let formattedDate;
              if (dateStr.includes('/')) {
                // YYYY/MM/DD または MM/DD/YYYY 形式を処理
                const dateParts = dateStr.split('/');
                if (dateParts.length === 3) {
                  if (dateParts[0].length === 4) {
                    // YYYY/MM/DD 形式
                    const year = parseInt(dateParts[0], 10);
                    const month = parseInt(dateParts[1], 10).toString().padStart(2, '0');
                    const day = parseInt(dateParts[2], 10).toString().padStart(2, '0');
                    formattedDate = `${year}-${month}-${day}`;
                  } else {
                    // MM/DD/YYYY または DD/MM/YYYY 形式と仮定
                    // ここでは MM/DD/YYYY と仮定
                    const year = parseInt(dateParts[2], 10);
                    const month = parseInt(dateParts[0], 10).toString().padStart(2, '0');
                    const day = parseInt(dateParts[1], 10).toString().padStart(2, '0');
                    formattedDate = `${year}-${month}-${day}`;
                  }
                } else {
                  throw new Error(`不正な日付フォーマット: ${dateStr}`);
                }
              } else {
                // すでに YYYY-MM-DD 形式と仮定
                formattedDate = dateStr;
              }
              
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
        
        // 進捗状況の更新
        const progress = Math.min(100, Math.round((endIdx / lines.length) * 100));
        setSuccess(`インポート中... ${progress}% 完了 (${successCount}件処理済み)`);
        
        // 次のチャンクがあれば処理、なければ完了
        currentChunk++;
        if (endIdx < lines.length) {
          // 次のチャンクを非同期で処理（UIをブロックしないため）
          setTimeout(processChunk, 0);
        } else {
          // 全チャンクの処理完了
          finishImport(newSalesData, successCount, errorCount);
        }
      };
      
      // 最初のチャンクを処理開始
      processChunk();
    } catch (error) {
      console.error('CSV処理エラー:', error);
      setError(`CSVデータの処理中にエラーが発生しました: ${error.message}`);
    }
  };

  // インポート完了時の処理
  const finishImport = (newSalesData, successCount, errorCount) => {
    if (successCount > 0) {
      setSalesData(newSalesData);
      setSuccess(`${successCount}件のデータをインポートしました${errorCount > 0 ? `（${errorCount}件の無効なデータはスキップされました）` : ''}`);
    } else if (errorCount > 0) {
      setError(`インポートに失敗しました。${errorCount}件の無効なデータがありました`);
    } else {
      setError('インポートするデータがありませんでした');
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
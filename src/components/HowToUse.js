import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import TuneIcon from '@mui/icons-material/Tune';

function HowToUse() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        使い方ガイド
      </Typography>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Future-Reportとは
        </Typography>
        <Typography paragraph>
          Future-Reportは、過去のデータを基に未来の数値を予測するための分析ツールです。
          需要予測、株価予測、売上予測など、様々な時系列データに対応しています。
        </Typography>
        <Typography paragraph>
          シンプルな操作で高度な予測分析が可能で、データのインポート/エクスポート機能を
          備えているため、他のアプリケーションとの連携も容易です。
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ステップ1: カテゴリーの設定
              </Typography>
              <Typography variant="body2" paragraph>
                「データ入力」タブで新しいカテゴリーを作成します。
                カテゴリーは製品、地域、部門など、分析したいデータの区分けに使います。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TableChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ステップ2: データの入力
              </Typography>
              <Typography variant="body2" paragraph>
                「データ入力」タブでカテゴリー、日付、数値を入力します。
                CSVファイルをインポートして、一括でデータを登録することも可能です。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TuneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ステップ3: 予測設定
              </Typography>
              <Typography variant="body2" paragraph>
                「予測分析」タブでカテゴリー、予測期間、予測モデルを選択します。
                データの特性に合わせて最適な予測モデルを選びましょう。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ステップ4: 結果の確認
              </Typography>
              <Typography variant="body2" paragraph>
                予測結果がグラフで表示されます。ズームイン/アウト機能を使って
                詳細に分析できます。データ範囲を調整して様々な角度から予測を検討しましょう。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          <ImportExportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          データのインポート・エクスポート
        </Typography>
        <Typography paragraph>
          既存のデータをCSV形式またはJSON形式でインポート/エクスポートできます。
          「データ入力」タブの「インポート」「エクスポート」ボタンを使用してください。
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          CSVファイルの形式:
        </Typography>
        <Typography variant="body2" component="pre" sx={{ 
          backgroundColor: '#f5f5f5', 
          p: 2, 
          borderRadius: 1,
          overflowX: 'auto'
        }}>
          category,date,value
          カテゴリーA,2023-01-01,100
          カテゴリーA,2023-02-01,120
          カテゴリーB,2023-01-01,200
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          予測モデルについて
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="単純移動平均" 
              secondary="データの短期的な変動を平滑化し、トレンドを把握するのに適しています。" 
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="ホルト法" 
              secondary="レベルとトレンドを考慮した予測を行います。上昇・下降傾向のあるデータに適しています。" 
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="ホルト・ウィンターズ法" 
              secondary="レベル、トレンド、季節性を考慮した予測を行います。季節変動のあるデータに最適です。" 
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="SARIMA" 
              secondary="季節性自己回帰和分移動平均モデル。時系列データの自己相関を利用した高度な統計モデルで、複雑な季節パターンの予測に優れています。" 
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Prophet" 
              secondary="Facebookが開発した時系列予測フレームワーク。トレンド、季節性、休日効果などを自動的に検出し、異常値に強いモデルです。" 
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="LSTM" 
              secondary="長短期記憶ニューラルネットワーク。複雑なパターンを学習し、長期的な依存関係を捉えることができるディープラーニングモデルです。" 
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="ランダムフォレスト" 
              secondary="複数の決定木モデルを組み合わせた機械学習アルゴリズム。非線形のパターンに強く、過学習に強い特徴があります。" 
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText 
              primary="アンサンブルモデル" 
              secondary="複数の予測モデルの結果を組み合わせて、より安定した予測を提供します。多くの場合で高い精度を発揮します。" 
            />
          </ListItem>
        </List>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          予測モデルの選び方
        </Typography>
        <Typography paragraph>
          データの特性に応じて適切なモデルを選択することで、予測精度を向上させることができます：
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="安定したデータ" 
              secondary="変動が少なく、トレンドや季節性のないデータには単純移動平均やホルト法が適しています。" 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="季節性のあるデータ" 
              secondary="定期的なパターンを持つデータには、ホルト・ウィンターズ法やSARIMAが効果的です。" 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="複雑なパターンのデータ" 
              secondary="複雑な変動やパターンを持つデータには、Prophet、LSTM、ランダムフォレストなどの高度なモデルが適しています。" 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="確実性を重視する場合" 
              secondary="予測の安定性を重視する場合は、アンサンブルモデルが最適です。複数のモデルの予測を組み合わせることで、精度が向上します。" 
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}

export default HowToUse; 
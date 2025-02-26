import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function CategoryManager({ categories, setCategories }) {
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (categoryToDelete) => {
    setCategories(categories.filter(category => category !== categoryToDelete));
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        カテゴリー管理
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="新しいカテゴリー"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleAddCategory}
          disabled={!newCategory.trim()}
        >
          追加
        </Button>
      </Box>
      
      <Paper elevation={2}>
        <List>
          {categories.map((category) => (
            <ListItem key={category}>
              <ListItemText primary={category} />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteCategory(category)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}

export default CategoryManager; 
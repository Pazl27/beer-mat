package com.example.beer_mat.tabs.food


import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.material3.Text

class FoodScreen {
    @Composable
    fun Content(modifier: Modifier = Modifier) {
        Text(text = "Food Content", modifier = modifier)
    }
}
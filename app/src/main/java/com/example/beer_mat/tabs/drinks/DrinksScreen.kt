package com.example.beer_mat.tabs.drinks

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.material3.Text

class DrinksScreen {
    @Composable
    fun Content(modifier: Modifier = Modifier) {
        Text(text = "Drinks Content", modifier = modifier)
    }
}
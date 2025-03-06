package com.example.beer_mat.tabs.drinks

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.example.beer_mat.components.AddFloatingActionButton
import com.example.beer_mat.components.ShowDialog
import com.example.beer_mat.tabs.SharedViewModel

class DrinksScreen(private val viewModel: SharedViewModel) {
    @Composable
    fun Content(modifier: Modifier = Modifier) {
        var showDialog by remember { mutableStateOf(false) }

        ShowDialog(
            showDialog = showDialog,
            title = "Drinks",
            message = "Drinks added",
            onDismiss = { showDialog = false }
        )

        Box(modifier = modifier.fillMaxSize()) {
            Text(text = "Drinks Content", modifier = Modifier.align(Alignment.TopStart))
            AddFloatingActionButton().Content(
                modifier = Modifier.align(Alignment.BottomEnd),
                onClick = {
                    showDialog = true
                }
            )
        }
    }
}
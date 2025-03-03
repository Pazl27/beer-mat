package com.example.beer_mat.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class AddFloatingActionButton {
    @Composable
    fun Content(modifier: Modifier = Modifier, onClick: () -> Unit) {
        Box(modifier = modifier.padding(16.dp)) {
            FloatingActionButton(
                onClick = onClick,
                modifier = Modifier.size(56.dp)
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Add")
            }
        }
    }
}
package com.example.beer_mat.tabs.members

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import com.example.beer_mat.components.AddFloatingActionButton
import com.example.beer_mat.components.ShowDialog

class MembersScreen {
    @Composable
    fun Content(modifier: Modifier = Modifier) {
        var showDialog by remember { mutableStateOf(false) }

        ShowDialog(
            showDialog = showDialog,
            title = "Members",
            message = "Member added",
            onDismiss = { showDialog = false }
        )

        Box(modifier = modifier.fillMaxSize()) {
            Text(text = "Food Content", modifier = Modifier.align(Alignment.TopStart))
            AddFloatingActionButton().Content(
                modifier = Modifier.align(Alignment.BottomEnd),
                onClick = {
                    showDialog = true
                }
            )
        }
    }
}

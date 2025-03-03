package com.example.beer_mat.tabs.members

import android.app.AlertDialog
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import com.example.beer_mat.components.AddFloatingActionButton

class MembersScreen {
    @Composable
    fun Content(modifier: Modifier = Modifier) {
        val context = LocalContext.current
        var showDialog by remember { mutableStateOf(false) }

        if (showDialog) {
            val builder = AlertDialog.Builder(context)
            builder.setTitle("Member").setMessage("Member added")
            val dialog = builder.create()
            dialog.show()
            showDialog = false
        }

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

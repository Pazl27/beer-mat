package com.example.beer_mat.tabs.drinks

import android.app.AlertDialog
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.example.beer_mat.components.AddFloatingActionButton

class DrinksScreen {
    @Composable
    fun Content(modifier: Modifier = Modifier) {
        val context = LocalContext.current
        var showDialog by remember { mutableStateOf(false) }

        if (showDialog) {
            val builder = AlertDialog.Builder(context)
            builder.setTitle("Drinks").setMessage("Drink added")
            val dialog = builder.create()
            dialog.show()
            showDialog = false
        }

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
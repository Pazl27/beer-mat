package com.example.beer_mat.tabs.members

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.material3.Text

class MembersScreen {
    @Composable
    fun Content(modifier: Modifier = Modifier) {
        Text(text = "Members Content", modifier = modifier)
    }
}
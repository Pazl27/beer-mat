package com.example.beer_mat.tabs.members

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.beer_mat.database.AppDatabase
import com.example.beer_mat.database.Member
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun MembersScreen(database: AppDatabase, modifier: Modifier = Modifier) {
    var membersList by remember { mutableStateOf<List<Member>>(emptyList()) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        coroutineScope.launch(Dispatchers.IO) {
            val memberItems = database.memberDao().getAllMembers()
            membersList = memberItems
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "Members",
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(16.dp)
            )

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(membersList) { member ->
                    MemberItemRow(member)
                }
            }
        }
    }
}

@Composable
fun MemberItemRow(member: Member) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = member.name, modifier = Modifier.weight(1f))
            Text(text = "${member.amountToPay} €", style = MaterialTheme.typography.bodyMedium)
        }
    }
}
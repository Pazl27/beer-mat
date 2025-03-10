package com.example.beer_mat.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface FoodDao {
    @Insert
    suspend fun insert(foodItem: FoodItem)

    @Query("SELECT * FROM food")
    suspend fun getAllFoodItems(): List<FoodItem>

    @Query("DELETE FROM food WHERE id = :id")
    suspend fun deleteFoodItem(id: Int)
}

@Dao
interface DrinkDao {
    @Insert
    suspend fun insert(drinkItem: DrinkItem)

    @Query("SELECT * FROM drinks")
    suspend fun getAllDrinkItems(): List<DrinkItem>

    @Query("DELETE FROM drinks WHERE id = :id")
    suspend fun deleteDrinkItem(id: Int)
}

@Dao
interface MemberDao {
    @Insert
    suspend fun insert(member: Member)

    @Query("SELECT * FROM members")
    suspend fun getAllMembers(): List<Member>

    @Query("DELETE FROM members WHERE id = :id")
    suspend fun deleteMember(id: Int)
}
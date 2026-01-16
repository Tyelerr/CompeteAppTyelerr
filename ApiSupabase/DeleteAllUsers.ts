import { supabase } from "./supabase";
import { UpdateProfile } from "./CrudUser";
import { EUserStatus } from "../hooks/InterfacesGlobal";

/**
 * Deletes all users from Supabase auth and marks their profiles as deleted.
 * Use with caution. Only for admin use.
 */
export async function DeleteAllUsers() {
  try {
    // Fetch all user profiles
    const { data: users, error } = await supabase.from("profiles").select("id");

    if (error) {
      throw error;
    }
    if (!users || users.length === 0) {
      return { message: "No users found to delete." };
    }

    for (const user of users) {
      try {
        // Delete user from auth
        await supabase.auth.admin.deleteUser(user.id);
        // Mark profile as deleted
        await UpdateProfile(user.id, { status: EUserStatus.StatusDeleted });
      } catch (deleteError) {
        console.error(`Failed to delete user ${user.id}:`, deleteError);
      }
    }

    return { message: `Deleted ${users.length} users.` };
  } catch (error) {
    console.error("Error deleting all users:", error);
    return { error };
  }
}

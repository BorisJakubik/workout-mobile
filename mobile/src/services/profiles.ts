import { supabase } from "@/src/lib/supabase";

export type Profile = {
  name: string;
  photo: string;
  surname: string;
};

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("first_name,last_name,avatar_url").eq("id", userId).maybeSingle();
  if (error) throw error;
  const profile = data as unknown as { avatar_url: string | null; first_name: string; last_name: string } | null;
  return profile ? { name: profile.first_name, photo: profile.avatar_url ?? "", surname: profile.last_name } : { name: "", photo: "", surname: "" };
}

export async function saveProfile(userId: string, profile: Profile): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ avatar_url: profile.photo || "", first_name: profile.name.trim(), id: userId, last_name: profile.surname.trim() });
  if (error) throw error;
}

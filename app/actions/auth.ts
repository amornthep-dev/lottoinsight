"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  }

  // ส่ง email verify แล้ว → ไป confirm page
  redirect("/auth/confirm");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

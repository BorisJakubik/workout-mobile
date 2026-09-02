import { supabase } from "@/src/lib/supabase";

export type CatalogExercise = {
  categoryId: string | null;
  id: string;
  name: string;
};

export type CatalogCategory = {
  icon: string;
  id: string;
  name: string;
};

export async function getCatalog(): Promise<{ categories: CatalogCategory[]; exercises: CatalogExercise[] }> {
  const [{ data: categoryData, error: categoryError }, { data: exerciseData, error: exerciseError }] = await Promise.all([
    supabase.from("categories").select("id,name,icon").order("name"),
    supabase.from("exercises").select("id,name,category_id").order("name"),
  ]);
  if (categoryError || exerciseError) throw categoryError || exerciseError;
  return {
    categories: categoryData as CatalogCategory[],
    exercises: (exerciseData as { category_id: string | null; id: string; name: string }[]).map((exercise) => ({
      categoryId: exercise.category_id,
      id: exercise.id,
      name: exercise.name,
    })),
  };
}

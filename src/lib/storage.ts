import { supabase } from "@/integrations/supabase/client";

async function uploadToBucket(file: File, bucket: string, folder: string): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

export async function uploadProductImage(file: File): Promise<string | null> {
  return uploadToBucket(file, "product-images", "products");
}

export async function uploadBrandOriginLogo(file: File): Promise<string | null> {
  return uploadToBucket(file, "brand-origin-logos", "logos");
}

export async function uploadCategoryImage(file: File): Promise<string | null> {
  return uploadToBucket(file, "brand-origin-logos", "categories");
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split("/product-images/");
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from("product-images")
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

export async function deleteBrandOriginLogo(imageUrl: string): Promise<boolean> {
  try {
    const urlParts = imageUrl.split("/brand-origin-logos/");
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from("brand-origin-logos")
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting logo:", error);
    return false;
  }
}

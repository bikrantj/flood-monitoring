'use server'

import { revalidatePath } from 'next/cache'

export async function refreshFloodData(formData: FormData): Promise<void> {
  // Revalidate the home page
  revalidatePath('/')
}

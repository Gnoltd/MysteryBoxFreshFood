import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

export async function uploadListingImage(vendorId: string, file: File): Promise<string> {
  const path = `listings/${vendorId}/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}

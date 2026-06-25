import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '../firebase'
import type { UserProfile } from '../types'

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: 'vendor' | 'customer',
  extra?: Partial<UserProfile>
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const createUserProfileFn = httpsCallable(functions, 'createUserProfile')
  await Promise.all([
    updateProfile(cred.user, { displayName }),
    createUserProfileFn({ role, displayName, lang: 'en', extra: extra ?? {} }),
  ])
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  const userRef = doc(db, 'users', cred.user.uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) {
    const createUserProfileFn = httpsCallable(functions, 'createUserProfile')
    await createUserProfileFn({
      role: 'customer',
      displayName: cred.user.displayName ?? '',
      lang: 'en',
    })
  }
}

export async function createGoogleUserProfile(
  _uid: string,
  displayName: string,
  _email: string,
  role: 'vendor' | 'customer',
  extra?: Partial<UserProfile>
): Promise<void> {
  const createUserProfileFn = httpsCallable(functions, 'createUserProfile')
  await createUserProfileFn({ role, displayName, lang: 'en', extra: extra ?? {} })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null
}

export async function updateUserLang(uid: string, lang: 'en' | 'vi'): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { lang })
}

export async function updateVendorProfile(
  uid: string,
  data: { storeName: string; address: string; storeDescription: string }
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function updateVendorBankInfo(
  uid: string,
  bankName: string,
  bankBin: string,
  bankAccount: string,
  bankAccountName: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { bankName, bankBin, bankAccount, bankAccountName })
}

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { UserProfile } from '../types'

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: 'vendor' | 'customer',
  extra?: Partial<UserProfile>
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await setDoc(doc(db, 'users', cred.user.uid), {
    role,
    displayName,
    email,
    lang: 'en',
    ...extra,
  })
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null
}

export async function updateUserLang(uid: string, lang: 'en' | 'vi'): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { lang })
}

export async function updateVendorBankInfo(
  uid: string,
  bankName: string,
  bankAccount: string,
  bankAccountName: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { bankName, bankAccount, bankAccountName })
}

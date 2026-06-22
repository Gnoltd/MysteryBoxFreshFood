import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
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

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  const userRef = doc(db, 'users', cred.user.uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) {
    await setDoc(userRef, {
      role: 'customer',
      displayName: cred.user.displayName ?? '',
      email: cred.user.email ?? '',
      lang: 'en',
      createdAt: serverTimestamp(),
    })
  }
}

export async function createGoogleUserProfile(
  uid: string,
  displayName: string,
  email: string,
  role: 'vendor' | 'customer',
  extra?: Partial<UserProfile>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    role,
    displayName,
    email,
    lang: 'en',
    ...extra,
  })
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
  bankBin: string,
  bankAccount: string,
  bankAccountName: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { bankName, bankBin, bankAccount, bankAccountName })
}

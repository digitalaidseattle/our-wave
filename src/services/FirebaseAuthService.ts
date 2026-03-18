
import { AuthError, AuthService, OAuthResponse } from '@digitalaidseattle/core';
import { firebaseClient } from '@digitalaidseattle/firebase';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth';

class FirebaseAuthService implements AuthService {

    getProviders(): string[] {
        return ["google"];
    }

    signInWith(provider: string): Promise<OAuthResponse> {
        switch (provider) {
            case 'google':
                return this.signInWithGoogle();
            default:
                throw new Error('Unrecognized provider ' + provider);
        }
    }

    hasUser(): Promise<boolean> {
        const auth = getAuth(firebaseClient);
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe(); // stop listening after first call
                resolve(user ? true : false);
            });
        });
    }

    getUser = async (): Promise<any | null> => {
        const auth = getAuth(firebaseClient);
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (gUser) => {
                unsubscribe(); // stop listening after first call
                const user = gUser ? {
                    email: gUser.email,
                    user_metadata: {
                        name: gUser.displayName,
                        avatar_url: gUser.photoURL,
                        email: gUser.email
                    }
                } : null;
                resolve(user);
            });
        });
    }

    signOut = async (): Promise<{ error: AuthError | null }> => {
        const auth = getAuth(firebaseClient)
        await auth.signOut();
        return { error: null };
    }

    signInWithGoogle = async (): Promise<any> => {
        try {
            const auth = getAuth(firebaseClient)
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            return {
                data: {
                    url: import.meta.env.VITE_AUTH_DOMAIN
                }
            };
        } catch (error) {
            console.error('signInWithGoogle', error);
            throw error;
        }
    }
}

export { FirebaseAuthService };


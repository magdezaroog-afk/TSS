import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const bypassLogin = async (role = 'admin', customName = '', customEmail = '', customUid = '', techLevel = 'junior') => {
        setLoading(true);
        // Use stable UIDs for dev accounts to prevent duplication
        const theUid = customUid || `dev_${role}`; 
        const theEmail = customEmail || `${role}.dev@litc.ly`;
        const theName = customName || (role === 'admin' ? 'مدير النظام' : 'موظف تجريبي');
        
        const userDocRef = doc(db, "users", theUid);
        const existingDoc = await getDoc(userDocRef);
        
        let userDataToSet = {
            uid: theUid,
            email: theEmail,
            displayName: theName,
            role: role,
            status: 'active',
            techLevel: techLevel
        };

        if (existingDoc.exists()) {
            userDataToSet = { ...userDataToSet, ...existingDoc.data() };
        } else {
            // check for existing email under different UID
            const emailQuery = query(collection(db, "users"), where("email", "==", theEmail));
            const emailSnap = await getDocs(emailQuery);
            if (!emailSnap.empty) {
                const existingUser = emailSnap.docs[0];
                userDataToSet = { ...existingUser.data(), uid: existingUser.id };
            } else {
                await setDoc(userDocRef, userDataToSet);
            }
        }
        
        setCurrentUser({ uid: userDataToSet.uid, email: userDataToSet.email, displayName: userDataToSet.displayName });
        setUserRole(userDataToSet.role);
        setUserData({ ...userDataToSet, department: 'إدارة تقنية المعلومات' });

        await setDoc(doc(db, "users", userDataToSet.uid), { ...userDataToSet, lastLogin: serverTimestamp() }, { merge: true });

        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                try {
                    // 1. Check by UID
                    const userDocRef = doc(db, "users", user.uid);
                    let userDoc = await getDoc(userDocRef);

                    // 2. If not found by UID, check by Email
                    if (!userDoc.exists()) {
                        const emailQuery = query(collection(db, "users"), where("email", "==", user.email.toLowerCase()));
                        const emailSnap = await getDocs(emailQuery);
                        if (!emailSnap.empty) {
                            userDoc = emailSnap.docs[0];
                        }
                    }

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserRole(data.role || 'user');
                        setUserData({ ...data, uid: userDoc.id });
                    } else {
                        const email = user.email.toLowerCase();
                        let initialRole = 'user';
                        if (email.includes('admin') || email === 'majdi.alzarrouk@litc.ly') {
                            initialRole = 'admin';
                        } else if (email.includes('it') || email.includes('engineer')) {
                            initialRole = 'engineer';
                        }
                        const newUserData = {
                            uid: user.uid,
                            email: email,
                            displayName: user.displayName || email.split('@')[0],
                            role: initialRole,
                            createdAt: serverTimestamp(),
                            lastLogin: serverTimestamp(),
                            status: 'active'
                        };
                        await setDoc(userDocRef, newUserData);
                        setUserRole(initialRole);
                        setUserData(newUserData);
                    }
                } catch (error) {
                    console.error("Auth sync error:", error);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const logout = async () => {
        try {
            await auth.signOut();
        } catch(e) {}
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
    };

    const value = {
        currentUser,
        userRole,
        userData,
        loading,
        bypassLogin,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

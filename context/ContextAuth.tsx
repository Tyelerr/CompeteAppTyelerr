import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../ApiSupabase/supabase';
import { GetSession } from '../ApiSupabase/CrudUser';
import { EUserRole, ICAUserData, EUserStatus } from '../hooks/InterfacesGlobal';

interface AuthContextType {
  isLogged: boolean;
  login: (user: ICAUserData) => void;
  set_user: (user: ICAUserData) => void;
  logout: () => void;
  user: ICAUserData | null; // example user data
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useContextAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLogged, set_isLogged] = useState<boolean>(false);
  const [user, set_user] = useState<ICAUserData | null>(null);

  // on start isLoading=true
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = (user: ICAUserData) => {
    set_isLogged(true);
    set_user(user);

    // // // // // // // // // // // console.log('user after login:', user);
  };
  const logout = () => {
    set_isLogged(false);
    set_user(null);
  };

  const authContextValue: AuthContextType = {
    isLogged,
    login,
    logout,
    user,
    set_user,
    isLoading,
  };

  // check if session
  /**/
  useEffect(() => {
    const TryToGetThesession = async () => {
      setIsLoading(true);

      const { user, error, case_ } = await GetSession();

      // // // // // // // // // // // console.log('user:', user)
      // // // // // // // // // // // console.log('error:', error)
      // // // // // // // // // // // console.log('case:', case_)

      if (user !== null) {
        login(user);
      }

      setIsLoading(false);
    };
    TryToGetThesession();

    /**/
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // we sign manually so no need this
        } else if (event === 'SIGNED_OUT') {
          logout();
        }
      },
    );

    return () => {
      // Cleanup the listener on component unmount
      authListener?.subscription.unsubscribe();
    };
  }, []);

  /*const [countTest, setcountTest] = useState<number>(0);
  useEffect(()=>{
    setcountTest(countTest + 1);
  }, [countTest]);*/

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

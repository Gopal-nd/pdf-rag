'use client'
import React from 'react'
import { Button } from './ui/button'
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

const Logout = () => {
    const router = useRouter();
  return (
    <Button onClick={async()=>{
        await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/login"); // redirect to login page
              },
            },
          });
    }}>
        Logout
    </Button>
  )
}

export default Logout
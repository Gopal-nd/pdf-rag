'use client'
import React, { useState } from 'react'
import { authClient } from '@/lib/auth-client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import Logout from '@/components/Logout'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAPIKEY } from '@/store/userApiKey'
import Link from 'next/link'


const Spinner: React.FC = () => (
    <div className="flex justify-center">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" />
    </div>
  )

const ProfilePage: React.FC = () => {
  const {
    data: session,
    isPending:sessionLoading,
    error,

  } = authClient.useSession()
  const {setKey,key} = useAPIKEY()
  const [userApiKey,setUserApiKey] = useState('')
  const {data,refetch,isPending} = useQuery({
    queryKey:['apikey'],
    queryFn:async()=>{
      const res = await axiosInstance.get('/api/apikey')
      return res.data.data
    },
    enabled:userApiKey.length>0 || !key 
    
  })
  const mutate = useMutation({
    mutationKey:['apikey'],
    mutationFn:async()=>{
      const res = await axiosInstance.post('/api/apikey',{key:userApiKey})
      return res.data.data
    },
    onSuccess:(key)=>{
      console.log(key)
      setKey(key)
      console.log(key)
      toast.success('updated key')
      refetch()
    },
    onError:(err)=>{
      console.log(err)
      toast.error('something went wrong, in updating key')
    }
  })
if(isPending || sessionLoading){
  <div>Loading..</div>
}

  console.log(data)
  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>


          {error && (
            <Alert>
              <AlertTitle>Session Error</AlertTitle>
              <AlertDescription>
                {error.message}.{' '}
                <button
                  onClick={() => refetch()}
                  className="underline hover:no-underline"
                >
                  Retry
                </button>
              </AlertDescription>
            </Alert>
          )}

          {session && (<>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  {session.user.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name} />
                  ) : (
                    <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{session.user.name}</p>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                </div>
              </div>

              <Tabs defaultValue="details" className="w-full">
                <TabsList>
                  <TabsTrigger value="details">Session Data</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <dt className="font-medium">Expires At</dt>
                      <dd className="text-sm text-muted-foreground">
                        {new Date(session?.session.expiresAt).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium">User Agent</dt>
                      <dd className="text-sm text-muted-foreground">{session?.session.userAgent}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">IP Address</dt>
                      <dd className="text-sm text-green-500">{session?.session.ipAddress}</dd>
                    </div>
                  </dl>
                </TabsContent>
                <TabsContent value="raw" className="mt-4">
                  <pre className="overflow-auto text-xs">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>

              <div className="pt-4">
                <Logout  />
              </div>
            </div>
            <div className="mt-8 p-6 border rounded-lg bg-muted">
  <h2 className="text-xl font-semibold mb-4 inline-block gap-2 mr-2">Your API Key</h2><span className='text-blue-400'><Link target='_blank' href={'https://aistudio.google.com/apikey'}>Get API KEY</Link></span>

  <form
    onSubmit={(e) => {
      e.preventDefault();
      mutate.mutate();
    }}
    className="space-y-4"
  >
    <div className="space-y-2">
      <Input
        placeholder="Enter your Gemini API Key"
        value={userApiKey || data }
        onChange={(e) => setUserApiKey(e.target.value)}
        className="text-sm"
      />
      <p className="text-xs text-muted-foreground">
        This API key will be used for authenticating your requests.
      </p>
    </div>

    <Button
      type="submit"
      className="w-full"
      disabled={mutate.isPending}
    >
      {mutate.isPending ? 'Updating...' : 'Update API Key'}
    </Button>
  </form>
</div>

          </>

          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage
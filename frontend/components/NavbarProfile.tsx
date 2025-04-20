'use client'

import { Button } from "./ui/button";
import { redirect } from "next/navigation";
import { ModeToggle } from './ModeToggle'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";

import { DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { authClient, useSession } from '@/lib/auth-client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import React from 'react'
import Image from 'next/image'

import { Wheat } from 'lucide-react'

const NavbarProfile = ({ }) => {
    const { data: session } = authClient.useSession()
    const user = session?.user



    return (

        <div className="flex justify-end items-centerc  gap-2 md:gap-4">
            <ModeToggle />
            {session ? (
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Avatar >
                            {user?.image ? (
                                <div className='relative aspect-square h-full w-full'>
                                    <Image src={user?.image} fill referrerPolicy='no-referrer' alt='profile picture' />
                                </div>
                            ) : (
                                <AvatarFallback>
                                    <span className='sr-only'>{user?.name}</span>
                                    <Wheat className='h-4 w-4' />
                                </AvatarFallback>
                            )}
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="" align="end">
                        <div className="flex p-2 items-center justify-start gap-2">
                            <div className="flex flex-col space-y-1 leading-none">
                                {user?.name && <p className="font-medium">{user?.name}</p>}
                                {user?.email && <p className="w-[200px] text-sm ">
                                    {user?.email}
                                </p>}
                            </div>
                        </div>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="cursor-pointer">
                            <Button onClick={async () => {
                                await authClient.signOut({
                                    fetchOptions: {
                                        onSuccess: () => {
                                            redirect("/sign-in")
                                        },
                                    },
                                });
                            }}>
                                Logout
                            </Button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (

                <Link href={"/sign-in"} >
                    Login
                </Link>

            )}
        </div>

    )
}

export default NavbarProfile
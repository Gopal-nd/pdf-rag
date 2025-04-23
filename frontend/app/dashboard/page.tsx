'use client'
import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Button
} from "@/components/ui/button"
import {
  Label
} from "@/components/ui/label"
import {
  Input
} from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import axiosInstance from '@/lib/axios'
import { toast } from 'sonner'
import { redirect } from 'next/navigation'

const fetchCollections = async (query: string) => {
  const res = await axiosInstance.get(`/api/collections?q=${query}`);
  return res.data.data;
};

const Dashboard = () => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string, description: string }>({ title: '', description: '' });

  const { data: collections = [], refetch } = useQuery({
    queryKey: ['collections', search],
    queryFn: () => fetchCollections(search),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post('/api/collections/new', form);
      return res.data;
    },
    onSuccess: (res) => {
      setForm({ title: '', description: '' });
      setOpen(false);
      toast.success(res.message);
      refetch();
    },
    onError: (error) => {
      toast.error((error as any).response?.data?.message || 'Something went wrong');
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: string, title: string, description: string }) => {
      const res = await axiosInstance.put(`api/collections/${id}`, { title, description });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message);
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error((error as any).response?.data?.message || 'Something went wrong');
    }
  });

  return (
    <div className="p-6 space-y-6 mx-auto">
      <div className="flex gap-4 items-center">
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <Button onClick={() => setOpen(true)}>Create</Button>
      </div>

      <ul className=" grid sm:grid-cols-1 grid-rows-1 md:grid-cols-2 lg:grid-cols-3 gap-2 items-center">
        {collections.map((col: any) => (
          <li key={col.id} className="border rounded-xl  p-4 shadow flex flex-col gap-2">
            {editingId === col.id ? (
              <>
                <Input
                  className="text-lg font-semibold"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Title"
                />
                <Input
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Description"
                />
                <div className="flex gap-2">
                  <Button variant="outline" className='w-[200px]' onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      editMutation.mutate({ id: col.id, title: editForm.title, description: editForm.description })
                    }
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <div onClick={()=>redirect(`/dashboard/${col.id}`)}>
                <div className="text-xl font-semibold">{col.title}</div>
                <p className="text-gray-700">{col.description || <i>No description</i>}</p>
                <Button
                 className='w-[100px]'
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(col.id);
                    setEditForm({ title: col.title, description: col.description || '' });
                  }}
                >
                  Edit
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

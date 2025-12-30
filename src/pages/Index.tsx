import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface User {
  name: string;
  pin: string;
}

interface Note {
  id: string;
  date: string;
  content: string;
  title: string;
  image?: string;
}

interface Reminder {
  id: string;
  date: string;
  time: string;
  description: string;
}

const Index = () => {
  const [step, setStep] = useState<'welcome' | 'register' | 'login' | 'dashboard'>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteImage, setNoteImage] = useState<string | undefined>(undefined);
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('diaryUser');
    const savedNotes = localStorage.getItem('diaryNotes');
    const savedReminders = localStorage.getItem('diaryReminders');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setStep('login');
    }
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedReminders) setReminders(JSON.parse(savedReminders));

    const timer = setTimeout(() => {
      if (step === 'welcome') {
        setStep(savedUser ? 'login' : 'register');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('diaryNotes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('diaryReminders', JSON.stringify(reminders));
  }, [reminders]);

  const handleRegister = () => {
    if (name.trim() && pin.length === 4) {
      const newUser = { name: name.trim(), pin };
      setUser(newUser);
      localStorage.setItem('diaryUser', JSON.stringify(newUser));
      setStep('dashboard');
      toast.success(`Добро пожаловать, ${name}!`);
    } else {
      toast.error('Введите имя и 4-значный PIN-код');
    }
  };

  const handleLogin = () => {
    if (user && loginPin === user.pin) {
      setStep('dashboard');
      toast.success(`С возвращением, ${user.name}!`);
    } else {
      toast.error('Неверный PIN-код');
      setLoginPin('');
    }
  };

  const handlePinInput = (digit: string) => {
    if (step === 'register') {
      if (pin.length < 4) setPin(pin + digit);
    } else {
      if (loginPin.length < 4) setLoginPin(loginPin + digit);
    }
  };

  const handlePinDelete = () => {
    if (step === 'register') {
      setPin(pin.slice(0, -1));
    } else {
      setLoginPin(loginPin.slice(0, -1));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Файл слишком большой (макс. 5МБ)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setNoteImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addNote = () => {
    if (noteContent.trim() && noteTitle.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content: noteContent,
        title: noteTitle.trim(),
        image: noteImage
      };
      setNotes([...notes, newNote]);
      setNoteContent('');
      setNoteTitle('');
      setNoteImage(undefined);
      setIsDialogOpen(false);
      toast.success('Запись добавлена');
    }
  };

  const updateNote = () => {
    if (editingNote && noteContent.trim() && noteTitle.trim()) {
      setNotes(notes.map(n => n.id === editingNote.id ? { 
        ...n, 
        content: noteContent, 
        title: noteTitle.trim(),
        image: noteImage 
      } : n));
      setEditingNote(null);
      setNoteContent('');
      setNoteTitle('');
      setNoteImage(undefined);
      setIsDialogOpen(false);
      toast.success('Запись обновлена');
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    toast.success('Запись удалена');
  };

  const addReminder = () => {
    if (selectedDate && reminderTime && reminderDescription.trim()) {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        date: selectedDate.toISOString(),
        time: reminderTime,
        description: reminderDescription
      };
      setReminders([...reminders, newReminder]);
      setReminderDescription('');
      setReminderTime('');
      setIsReminderDialogOpen(false);
      toast.success('Напоминание добавлено');
    }
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
    toast.success('Напоминание удалено');
  };

  const exportData = () => {
    const data = { notes, reminders, user };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diary-backup.json';
    a.click();
    toast.success('Данные экспортированы');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.notes) setNotes(data.notes);
          if (data.reminders) setReminders(data.reminders);
          toast.success('Данные импортированы');
        } catch {
          toast.error('Ошибка чтения файла');
        }
      };
      reader.readAsText(file);
    }
  };

  const todayNotes = notes.filter(n => {
    const noteDate = new Date(n.date);
    const today = new Date();
    return noteDate.toDateString() === today.toDateString();
  });

  const todayReminders = reminders.filter(r => {
    const reminderDate = new Date(r.date);
    const today = new Date();
    return reminderDate.toDateString() === today.toDateString();
  });

  const sortedNotes = [...notes].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const selectedDateReminders = reminders.filter(r => {
    const reminderDate = new Date(r.date);
    return selectedDate && reminderDate.toDateString() === selectedDate.toDateString();
  });

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-xl">
            <Icon name="BookHeart" size={48} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-2">Мои личные записи</h2>
          <p className="text-muted-foreground text-lg">Твоё личное пространство для мыслей</p>
        </div>
      </div>
    );
  }

  if (step === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md animate-scale-in shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
              <Icon name="Sparkles" size={40} className="text-white" />
            </div>
            <CardTitle className="text-3xl">Добро пожаловать!</CardTitle>
            <CardDescription>Давай познакомимся</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Как тебя зовут?</Label>
              <Input
                id="name"
                placeholder="Твоё имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Создай PIN-код (4 цифры)</Label>
              <div className="flex justify-center gap-3 mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-bold"
                  >
                    {pin[i] ? '●' : '○'}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <Button
                    key={digit}
                    onClick={() => handlePinInput(digit.toString())}
                    variant="outline"
                    className="h-14 text-xl font-semibold"
                  >
                    {digit}
                  </Button>
                ))}
                <Button
                  onClick={handlePinDelete}
                  variant="outline"
                  className="h-14 text-xl font-semibold"
                >
                  <Icon name="Delete" size={20} />
                </Button>
                <Button
                  onClick={() => handlePinInput('0')}
                  variant="outline"
                  className="h-14 text-xl font-semibold"
                >
                  0
                </Button>
                <Button
                  onClick={handleRegister}
                  variant="default"
                  className="h-14 text-xl font-semibold"
                >
                  <Icon name="Check" size={20} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md animate-scale-in shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
              <Icon name="User" size={40} className="text-white" />
            </div>
            <CardTitle className="text-3xl">С возвращением, {user?.name}!</CardTitle>
            <CardDescription>Введи свой PIN-код</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-bold"
                >
                  {loginPin[i] ? '●' : '○'}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <Button
                  key={digit}
                  onClick={() => handlePinInput(digit.toString())}
                  variant="outline"
                  className="h-14 text-xl font-semibold"
                >
                  {digit}
                </Button>
              ))}
              <Button
                onClick={handlePinDelete}
                variant="outline"
                className="h-14 text-xl font-semibold"
              >
                <Icon name="Delete" size={20} />
              </Button>
              <Button
                onClick={() => handlePinInput('0')}
                variant="outline"
                className="h-14 text-xl font-semibold"
              >
                0
              </Button>
              <Button
                onClick={handleLogin}
                variant="default"
                className="h-14 text-xl font-semibold"
              >
                <Icon name="Check" size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50">
      <div className="flex">
        <aside className="hidden md:flex flex-col w-72 min-h-screen bg-white/80 backdrop-blur-sm border-r p-6 space-y-2">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Icon name="BookHeart" size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Привет, {user?.name}!</h2>
                <p className="text-xs text-muted-foreground">{format(new Date(), 'd MMM', { locale: ru })}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'home' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary/20'
            }`}
          >
            <Icon name="Home" size={20} />
            <span className="font-medium">Главная</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'notes' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary/20'
            }`}
          >
            <Icon name="BookOpen" size={20} />
            <span className="font-medium">Записи</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'calendar' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary/20'
            }`}
          >
            <Icon name="Calendar" size={20} />
            <span className="font-medium">Календарь</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'export' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary/20'
            }`}
          >
            <Icon name="Download" size={20} />
            <span className="font-medium">Данные</span>
          </button>

          <div className="flex-1"></div>

          <button
            onClick={() => {
              setStep('login');
              setLoginPin('');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-all"
          >
            <Icon name="LogOut" size={20} />
            <span className="font-medium">Выход</span>
          </button>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Привет, {user?.name}!</h1>
                <p className="text-sm text-muted-foreground">{format(new Date(), 'd MMMM yyyy', { locale: ru })}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setStep('login'); setLoginPin(''); }}>
                <Icon name="LogOut" size={20} />
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={activeTab === 'home' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('home')}
                className="flex-shrink-0"
              >
                <Icon name="Home" size={16} className="mr-1" />
                Главная
              </Button>
              <Button
                variant={activeTab === 'notes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('notes')}
                className="flex-shrink-0"
              >
                <Icon name="BookOpen" size={16} className="mr-1" />
                Записи
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('calendar')}
                className="flex-shrink-0"
              >
                <Icon name="Calendar" size={16} className="mr-1" />
                Календарь
              </Button>
              <Button
                variant={activeTab === 'export' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('export')}
                className="flex-shrink-0"
              >
                <Icon name="Download" size={16} className="mr-1" />
                Данные
              </Button>
            </div>
          </div>

        <div className="max-w-5xl mx-auto">

          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Bell" size={20} className="text-primary" />
                    Напоминания на сегодня
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayReminders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Нет напоминаний на сегодня</p>
                  ) : (
                    <div className="space-y-3">
                      {todayReminders.map((reminder) => (
                        <div key={reminder.id} className="p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{reminder.description}</p>
                              <p className="text-sm text-muted-foreground mt-1">⏰ {reminder.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="PenLine" size={20} className="text-primary" />
                    Записи за сегодня
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayNotes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Пока нет записей за сегодня</p>
                  ) : (
                    <div className="space-y-3">
                      {todayNotes.map((note) => (
                        <div key={note.id} className="p-3 bg-accent/30 rounded-lg">
                          <p className="font-medium">{note.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="animate-fade-in">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Личные записи</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <Icon name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={16} />
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { 
                          setEditingNote(null); 
                          setNoteContent(''); 
                          setNoteTitle('');
                          setNoteImage(undefined);
                        }}>
                          <Icon name="Plus" size={16} className="mr-1" />
                          Новая запись
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{editingNote ? 'Редактировать запись' : 'Новая запись'}</DialogTitle>
                          <DialogDescription>
                            Добавь заголовок, текст и фото к своей записи
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Заголовок</Label>
                            <Input
                              placeholder="Название записи..."
                              value={noteTitle}
                              onChange={(e) => setNoteTitle(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Фото (необязательно)</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="cursor-pointer"
                            />
                            {noteImage && (
                              <div className="mt-3 relative">
                                <img src={noteImage} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2"
                                  onClick={() => setNoteImage(undefined)}
                                >
                                  <Icon name="X" size={16} />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label>Текст записи</Label>
                            <Textarea
                              placeholder="Начни писать..."
                              value={noteContent}
                              onChange={(e) => setNoteContent(e.target.value)}
                              rows={6}
                            />
                          </div>
                          <Button onClick={editingNote ? updateNote : addNote} className="w-full">
                            {editingNote ? 'Сохранить' : 'Создать'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sortedNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">У тебя пока нет записей</p>
                    <p className="text-sm text-muted-foreground">Нажми "Новая запись" чтобы начать</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedNotes.map((note) => (
                      <div key={note.id} className="p-5 bg-white/60 backdrop-blur-sm rounded-2xl hover:shadow-lg transition-all border border-white/50">
                        <div className={note.image ? 'grid md:grid-cols-[200px_1fr] gap-4' : ''}>
                          {note.image && (
                            <img 
                              src={note.image} 
                              alt={note.title} 
                              className="w-full h-48 md:h-full object-cover rounded-xl" 
                            />
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-xl mb-1 text-foreground">{note.title}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Icon name="Clock" size={14} />
                                  {format(new Date(note.date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingNote(note);
                                    setNoteContent(note.content);
                                    setNoteTitle(note.title);
                                    setNoteImage(note.image);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Icon name="Pencil" size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteNote(note.id)}
                                >
                                  <Icon name="Trash2" size={16} />
                                </Button>
                              </div>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="animate-fade-in">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Календарь напоминаний</CardTitle>
                <CardDescription>Выбери дату для просмотра или добавления напоминаний</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={ru}
                      className="rounded-lg border"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">
                        {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : 'Выбери дату'}
                      </h3>
                      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" disabled={!selectedDate}>
                            <Icon name="Plus" size={16} className="mr-1" />
                            Добавить
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Новое напоминание</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Время</Label>
                              <Input
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Описание</Label>
                              <Textarea
                                placeholder="О чём напомнить?"
                                value={reminderDescription}
                                onChange={(e) => setReminderDescription(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <Button onClick={addReminder} className="w-full">
                              Создать
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {selectedDateReminders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Нет напоминаний на эту дату</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateReminders.map((reminder) => (
                          <div key={reminder.id} className="p-3 bg-secondary/30 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium">{reminder.description}</p>
                                <p className="text-sm text-muted-foreground mt-1">⏰ {reminder.time}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteReminder(reminder.id)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="animate-fade-in">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Экспорт и импорт данных</CardTitle>
                <CardDescription>Сохрани или восстанови свои записи</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon name="Download" size={20} />
                        Экспорт данных
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Сохрани все свои записи и напоминания в файл
                      </p>
                      <Button onClick={exportData} className="w-full">
                        <Icon name="Download" size={16} className="mr-2" />
                        Скачать резервную копию
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon name="Upload" size={20} />
                        Импорт данных
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Восстанови данные из резервной копии
                      </p>
                      <Label htmlFor="import-file" className="cursor-pointer">
                        <div className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors">
                          <Icon name="Upload" size={16} className="mr-2" />
                          Загрузить файл
                        </div>
                      </Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="hidden"
                      />
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Статистика</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <p className="text-3xl font-bold text-primary">{notes.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">Записей</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <p className="text-3xl font-bold text-primary">{reminders.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">Напоминаний</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
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

  const addNote = () => {
    if (noteContent.trim()) {
      const words = noteContent.trim().split(' ');
      const title = words.slice(0, 4).join(' ');
      const newNote: Note = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content: noteContent,
        title: title || 'Без заголовка'
      };
      setNotes([...notes, newNote]);
      setNoteContent('');
      setIsDialogOpen(false);
      toast.success('Запись добавлена! 📝');
    }
  };

  const updateNote = () => {
    if (editingNote && noteContent.trim()) {
      const words = noteContent.trim().split(' ');
      const title = words.slice(0, 4).join(' ');
      setNotes(notes.map(n => n.id === editingNote.id ? { ...n, content: noteContent, title } : n));
      setEditingNote(null);
      setNoteContent('');
      setIsDialogOpen(false);
      toast.success('Запись обновлена! ✏️');
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
      toast.success('Напоминание добавлено! 🔔');
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
    toast.success('Данные экспортированы! 📦');
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
          toast.success('Данные импортированы! 📥');
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
          <h1 className="text-6xl font-bold text-primary mb-4">✨</h1>
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
            <div className="text-5xl mb-4">🌸</div>
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
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '←', 0, '✓'].map((digit) => (
                  <Button
                    key={digit}
                    onClick={() => {
                      if (digit === '←') handlePinDelete();
                      else if (digit === '✓') handleRegister();
                      else handlePinInput(digit.toString());
                    }}
                    variant={digit === '✓' ? 'default' : 'outline'}
                    className="h-14 text-xl font-semibold"
                  >
                    {digit}
                  </Button>
                ))}
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
            <div className="text-5xl mb-4">✨</div>
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '←', 0, '✓'].map((digit) => (
                <Button
                  key={digit}
                  onClick={() => {
                    if (digit === '←') handlePinDelete();
                    else if (digit === '✓') handleLogin();
                    else handlePinInput(digit.toString());
                  }}
                  variant={digit === '✓' ? 'default' : 'outline'}
                  className="h-14 text-xl font-semibold"
                >
                  {digit}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50 pb-8">
      <div className="container max-w-6xl mx-auto p-4 pt-8">
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-1">Привет, {user?.name}! 🌈</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setStep('login');
              setLoginPin('');
            }}
            className="rounded-full"
          >
            <Icon name="LogOut" size={20} />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="home" className="flex items-center gap-2 py-3">
              <Icon name="Home" size={18} />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2 py-3">
              <Icon name="BookOpen" size={18} />
              <span className="hidden sm:inline">Записи</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2 py-3">
              <Icon name="Calendar" size={18} />
              <span className="hidden sm:inline">Календарь</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2 py-3">
              <Icon name="Download" size={18} />
              <span className="hidden sm:inline">Данные</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6 animate-fade-in">
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
          </TabsContent>

          <TabsContent value="notes" className="animate-fade-in">
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
                        <Button size="sm" onClick={() => { setEditingNote(null); setNoteContent(''); }}>
                          <Icon name="Plus" size={16} className="mr-1" />
                          Новая запись
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingNote ? 'Редактировать запись' : 'Новая запись'}</DialogTitle>
                          <DialogDescription>
                            Первые 4 слова станут заголовком
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Начни писать..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            rows={6}
                          />
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
                      <div key={note.id} className="p-4 bg-accent/20 rounded-xl hover:bg-accent/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{note.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {format(new Date(note.date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                            </p>
                            <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingNote(note);
                                setNoteContent(note.content);
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="animate-fade-in">
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
          </TabsContent>

          <TabsContent value="export" className="animate-fade-in">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate,} from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Alert, AppBar, Avatar, Button, Card, CardContent, Chip, Container, Divider, IconButton, MenuItem, Select, Stack, TextField, Toolbar, Typography,
} from '@mui/material'
import { Add, ArrowBack, ArrowForward, Check, CheckCircleOutline, CloudUploadOutlined, DeleteOutline, DownloadOutlined, EditOutlined, InsertDriveFileOutlined,
  LockOutlined, Logout, PersonOutline, ShieldOutlined,} from '@mui/icons-material'
import '@fontsource-variable/inter'
import './style.css'


// Типы загруженного файла, областей скрытия и общего состояния.
type Category = 'Лицо' | 'Автомобильный номер' | 'Телефон'
type Mask = { id: number; x: number; y: number; w: number; h: number; category: Category }
type Upload = { file: File; url: string; kind: 'image' | 'pdf' }
type State = {
  upload: Upload | null
  masks: Mask[]
  setUpload: (file: File | null) => void
  setMasks: React.Dispatch<React.SetStateAction<Mask[]>>
  user: string | null
  setUser: (name: string | null) => void
}

// Контекст позволяет экранам работать с одним файлом и списком масок.
const Context = createContext<State | null>(null)
const useApp = () => {
  const value = useContext(Context)
  if (!value) throw new Error('App provider missing')
  return value
}


// Material UI:
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#533afd', dark: '#4434d4', light: '#665efd' },
    secondary: { main: '#1c1e54' },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#0d253d', secondary: '#64748d' },
    divider: '#e3e8ee',
  },
  typography: {
    fontFamily: '"Inter Variable", "SF Pro Display", system-ui, sans-serif',
    fontSize: 15,
    fontWeightLight: 300,
    fontWeightRegular: 300,
    fontWeightMedium: 400,
    h1: {
      fontSize: 'clamp(2.25rem, 4.3vw, 3.5rem)',
      fontWeight: 300,
      lineHeight: 1.03,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: 'clamp(2rem, 3.5vw, 3rem)',
      fontWeight: 300,
      lineHeight: 1.15,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.375rem',
      fontWeight: 300,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    body1: { fontSize: 15, fontWeight: 300, lineHeight: 1.6 },
    body2: { fontSize: 14, fontWeight: 300, lineHeight: 1.5 },
    button: { fontSize: 14, fontWeight: 400, textTransform: 'none', lineHeight: 1.4 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 9999,
          padding: '8px 16px',
          minHeight: 40,
          transition: 'background-color 150ms, box-shadow 150ms',
          '&.Mui-focusVisible': { outline: '3px solid #b9b9f9', outlineOffset: 3 },
        },
        containedPrimary: {
          '&:hover': { backgroundColor: '#4434d4' },
          '&:active': { backgroundColor: '#2e2b8c' },
        },
        outlined: { borderColor: '#533afd' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #e3e8ee', boxShadow: '0 1px 3px rgba(0,55,112,.08)' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#a8c3de' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#533afd' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
        standardInfo: {
          backgroundColor: '#f6f9fc',
          color: '#273951',
          border: '1px solid #e3e8ee',
          '& .MuiAlert-icon': { color: '#665efd' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 400,
          backgroundColor: '#eeeeff',
          color: '#4434d4',
        },
      },
    },
  },
})


// Храним данные текущей сессии в памяти, до обновления страницы.
function Provider({ children }: { children: React.ReactNode }) {
  const [upload, setCurrent] = useState<Upload | null>(null)
  const [masks, setMasks] = useState<Mask[]>([])
  const [user, setUser] = useState<string | null>(null)

  // При замене файла освобождаем его старый URL и сбрасываем выделения.
  const setUpload = (file: File | null) => {
    if (upload) URL.revokeObjectURL(upload.url)
    setMasks([])
    setCurrent(
      file
        ? {
            file,
            url: URL.createObjectURL(file),
            kind: file.type === 'application/pdf' ? 'pdf' : 'image',
          }
        : null,
    )
  }

  // Освобождаем временный URL при смене файла или удалении провайдера.
  useEffect(
    () => () => {
      if (upload) URL.revokeObjectURL(upload.url)
    },
    [upload],
  )
  return (
    <Context.Provider value={{ upload, masks, setMasks, setUpload, user, setUser }}>
      {children}
    </Context.Provider>
  )
}


// Текущая страница задаёт активный шаг; предыдущие шаги отмечаем галочками.
function WorkflowStepper() {
  const { pathname } = useLocation()
  const steps = [
    { path: '/', title: 'Загрузка' },
    { path: '/review', title: 'Проверка' },
    { path: '/export', title: 'Экспорт' },
  ]
  const currentStep = steps.findIndex((step) => step.path === pathname)



  return (
    <nav className="workflow" aria-label="Этапы обработки файла">
      <ol className="workflow-steps">
        {steps.map((step, index) => {
          const active = index === currentStep
          const complete = index < currentStep
          const state = active ? 'active' : complete ? 'complete' : 'pending'

          return (
            <li
              key={step.path}
              className={`workflow-step workflow-step--${state}`}
              aria-current={active ? 'step' : undefined}
            >
              <Link
                to={step.path}
                className="workflow-link"
                aria-current={active ? 'step' : undefined}
                aria-label={`${step.title}: ${active ? 'в процессе' : complete ? 'завершён' : 'впереди'}`}
              >
                <span className="workflow-marker" aria-hidden="true">
                  {complete && <Check />}
                  {active && <span className="workflow-dot" />}
                </span>
                <span className="workflow-title">{step.title}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Общая оболочка страниц: логотип, навигация и вход в аккаунт.
function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useApp()
  return (
    <>
      <AppBar position="fixed" elevation={0} className="appbar">
        <Container maxWidth="lg">
          <Toolbar disableGutters className="toolbar">
            <Link className="brand" to="/">
              <span className="brand-icon">
                <ShieldOutlined fontSize="small" />
              </span>{' Контур'}<span className="brand-suffix"> / очистка данных</span>
            </Link>
            <WorkflowStepper />
            <Button
              component={Link}
              to={user ? '/profile' : '/auth'}
              variant="outlined"
              color="inherit"
              startIcon={<PersonOutline />}
              className="account-btn"
            >
              <span className="account-label">{user ?? 'Войти'}</span>
            </Button>
          </Toolbar>
        </Container>
      </AppBar>
      {children}
      <footer>
        <Container maxWidth="lg"></Container>
      </footer>
    </>
  )
}


// Разрешённые MIME-типы для загрузки.
const valid = (f: File) => ['image/jpeg', 'image/png', 'application/pdf'].includes(f.type)


function Home() {
  const { upload, setUpload } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const accept = (file?: File) => {
    if (!file) return
    if (!valid(file)) {
      setError('Поддерживаются только JPG, PNG и PDF.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Выберите файл размером до 20 МБ.')
      return
    }
    setError('')
    setUpload(file)
    navigate('/review')
  }
  return (
    <Container maxWidth="lg" className="main home">
      <div className="home-grid">
        <section>
          <Chip
            icon={<LockOutlined />}
            label="Ваши файлы остаются в браузере"
            className="intro-chip"
          />
          <Typography variant="h1" sx={{ mt: 3 }}>
            Скройте личные данные перед отправкой файла
          </Typography>
          <Typography className="lead">
            Загрузите фотографию или документ, проверьте области с персональными данными и
            скачайте обработанную копию.
          </Typography>
          <div className="flow">
            <div>
            </div>
          </div>
        </section>
        <Card className="upload-card">
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, '&:last-child': { pb: 3.5 } }}>
            <Typography variant="h3">Новый файл</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Начните с изображения или PDF
            </Typography>
            <div
              className="dropzone"
              role="button"
              tabIndex={0}
              onClick={() => input.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') input.current?.click()
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                accept(e.dataTransfer.files[0])
              }}
            >
              <div className="upload-icon">
                <CloudUploadOutlined fontSize="large" />
              </div>
              <strong>Перетащите файл сюда</strong>
              <span>или нажмите, чтобы выбрать</span>
              <small>JPG, PNG, PDF · до 20 МБ</small>
            </div>
            <input
              ref={input}
              hidden
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(e) => {
                accept(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {upload && (
              <Button
                sx={{ mt: 2 }}
                fullWidth
                variant="outlined"
                component={Link}
                to="/review"
              >
                Продолжить работу с {upload.file.name}
              </Button>
            )}

          </CardContent>
        </Card>
      </div>
    </Container>
  )
}


// Редактор изображения: рисование масок и управление их списком.
function Review() {
  const { upload, masks, setMasks } = useApp()
  const [category, setCategory] = useState<Category>('Лицо')
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null)
  const [draft, setDraft] = useState<Mask | null>(null)
  const surface = useRef<HTMLDivElement>(null)

  if (!upload)
    return (
      <Empty
        title="Сначала загрузите файл"
        detail="После загрузки он появится здесь для проверки."
      />
    )

  // Координаты в процентах сохраняют положение маски при изменении размера просмотра.
  const position = (e: React.PointerEvent) => {
    const r = surface.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    }
  }

  // Захват указателя позволяет закончить выделение за пределами изображения.
  const start = (e: React.PointerEvent) => {
    if (upload.kind !== 'image') return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrawing(position(e))
    setDraft(null)
  }

  // Черновик прямоугольника обновляется во время движения указателя.
  const move = (e: React.PointerEvent) => {
    if (!drawing) return
    const p = position(e)
    setDraft({
      id: Date.now(),
      x: Math.min(p.x, drawing.x),
      y: Math.min(p.y, drawing.y),
      w: Math.abs(p.x - drawing.x),
      h: Math.abs(p.y - drawing.y),
      category,
    })
  }

  // Сохраняем область, только если обе стороны занимают хотя бы 1% изображения.
  const end = () => {
    if (draft && draft.w >= 1 && draft.h >= 1) setMasks((v) => [...v, draft])
    setDrawing(null)
    setDraft(null)
  }

  // Одинаковая разметка для сохранённых областей и текущего черновика.
  const maskView = (m: Mask, preview = false) => (
    <div
      key={m.id}
      className={`mask ${preview ? 'draft-mask' : ''}`}
      style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}
    >
      {!preview && <span>{m.category}</span>}
    </div>
  )
  return (
    <Container maxWidth="lg" className="main review-page">
      <div className="heading-row">
        <div>
          <Typography className="eyebrow">ШАГ 2 ИЗ 3</Typography>
          <Typography variant="h2">Проверка областей</Typography>
          <Typography color="text.secondary">
            Добавьте прямоугольные маски на изображении и проверьте список перед
            экспортом.
          </Typography>
        </div>
        <Button component={Link} to="/" startIcon={<ArrowBack />} variant="text">
          Другой файл
        </Button>
      </div>
      <div className="workspace">
        <Card className="viewer">
          <div className="viewer-top">
            <InsertDriveFileOutlined color="primary" />
            <span title={upload.file.name}>{upload.file.name}</span>
            <Chip size="small" label={upload.kind === 'pdf' ? 'PDF' : 'Изображение'} />
          </div>
          {upload.kind === 'image' ? (
            <div className="image-frame">
              <div
                ref={surface}
                className="image-surface"
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
              >
                <img
                  src={upload.url}
                  alt="Загруженный файл для проверки"
                  draggable={false}
                />
                {masks.map((m) => maskView(m))}
                {draft && maskView(draft, true)}
              </div>
            </div>
          ) : (
            <iframe
              className="pdf-frame"
              src={upload.url}
              title="Предварительный просмотр PDF"
            />
          )}
          <div className="viewer-bottom">
            {upload.kind === 'image'
              ? 'Нажмите и протяните курсор по области, которую нужно закрыть.'
              : 'PDF можно просмотреть. Редактирование страниц будет добавлено позже.'}
          </div>
        </Card>
        <aside className="side-panel">
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EditOutlined color="primary" />
                <Typography variant="h3">Скрытые области</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 1.5, mb: 2.5 }}>
                Выберите тип и выделите нужный участок на изображении.
              </Typography>
              <Select
                fullWidth
                size="small"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                disabled={upload.kind === 'pdf'}
                aria-label="Тип персональных данных"
              >
                <MenuItem value="Лицо">Лицо</MenuItem>
                <MenuItem value="Автомобильный номер">Автомобильный номер</MenuItem>
                <MenuItem value="Телефон">Телефон</MenuItem>
              </Select>
              <Divider sx={{ my: 3 }} />
              <Typography fontWeight={400} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                Добавлено: {masks.length}
              </Typography>
              {masks.length ? (
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {masks.map((m, i) => (
                    <div className="mask-row" key={m.id}>
                      <span>
                        <b>{String(i + 1).padStart(2, '0')}</b> {m.category}
                      </span>
                      <IconButton
                        size="small"
                        aria-label={`Удалить область ${i + 1}`}
                        onClick={() => setMasks((v) => v.filter((x) => x.id !== m.id))}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </div>
                  ))}
                </Stack>
              ) : (
                <div className="empty-masks">
                  <Add />
                  <span>Пока нет выделенных областей</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Button
            variant="contained"
            component={Link}
            to="/export"
            endIcon={<ArrowForward />}
            fullWidth
            sx={{ mt: 2 }}
            disabled={upload.kind === 'pdf' || !masks.length}
          >
            Перейти к экспорту
          </Button>
          {upload.kind === 'pdf' && (
            <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 14 }}>
              Экспорт PDF будет реализован вместе с обработкой документов.
            </Typography>
          )}
        </aside>
      </div>
    </Container>
  )
}


// Создаём PNG-копию через canvas: исходный файл остаётся без изменений.
async function exportImage(upload: Upload, masks: Mask[]) {
  const image = new Image()
  image.src = upload.url
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(image, 0, 0)
  ctx.fillStyle = '#111827'

  // Переводим проценты в пиксели исходного изображения и закрашиваем области.
  for (const m of masks)
    ctx.fillRect(
      Math.floor((m.x / 100) * canvas.width),
      Math.floor((m.y / 100) * canvas.height),
      Math.ceil((m.w / 100) * canvas.width),
      Math.ceil((m.h / 100) * canvas.height),
    )

  // Преобразуем canvas в PNG и запускаем скачивание через временную ссылку.
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not export'))),
      'image/png',
    ),
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = upload.file.name.replace(/\.[^.]+$/, '') + '-cleaned.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// Предпросмотр обработанной копии и кнопка скачивания.
function Export() {
  const { upload, masks } = useApp()
  const [error, setError] = useState('')
  if (!upload)
    return (
      <Empty
        title="Нет файла для экспорта"
        detail="Загрузите файл и отметьте области, которые нужно скрыть."
      />
    )
  return (
    <Container maxWidth="md" className="main export-page">
      <Typography className="eyebrow">ШАГ 3 ИЗ 3</Typography>
      <Typography variant="h2">Экспорт копии</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Проверьте результат и сохраните отдельный файл.
      </Typography>
      <div className="export-grid">
        <Card>
          <CardContent sx={{ p: 3 }}>
            <div className="export-preview">
              {upload.kind === 'image' ? (
                <div className="export-image">
                  <img src={upload.url} alt="Предпросмотр обработанного изображения" />
                  {masks.map((m) => (
                    <div
                      key={m.id}
                      className="export-mask"
                      style={{
                        left: `${m.x}%`,
                        top: `${m.y}%`,
                        width: `${m.w}%`,
                        height: `${m.h}%`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <InsertDriveFileOutlined sx={{ fontSize: 72 }} />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ p: 3.5 }}>
            <CheckCircleOutline color="success" sx={{ fontSize: 42 }} />
            <Typography variant="h3" sx={{ mt: 2 }}>
              Готово к скачиванию
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              {upload.file.name}
              <br />
              Закрытых областей: {masks.length}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              При сохранении отмеченные участки изображения закрашиваются чёрным цветом.
              Исходный файл остаётся без изменений.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<DownloadOutlined />}
              disabled={upload.kind !== 'image' || !masks.length}
              onClick={() =>
                exportImage(upload, masks).catch(() =>
                  setError('Не удалось создать файл. Попробуйте другое изображение.'),
                )
              }
            >
              Скачать PNG
            </Button>
            <Button
              fullWidth
              component={Link}
              to="/review"
              sx={{ mt: 1.5 }}
              startIcon={<ArrowBack />}
            >
              Вернуться к проверке
            </Button>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}


// Демонстрационная авторизация: проверяем поля и сохраняем только имя в памяти.
function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { setUser } = useApp()
  const navigate = useNavigate()
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !email.includes('@') ||
      password.length < 6 ||
      (mode === 'register' && !name.trim())
    ) {
      setError('Введите корректные данные. Пароль — не менее 6 символов.')
      return
    }
    setUser(mode === 'register' ? name.trim() : email.split('@')[0])
    navigate('/profile')
  }
  return (
    <Container maxWidth="sm" className="main auth-page">
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <div className="auth-emblem">
            <LockOutlined />
          </div>
          <Typography variant="h2" sx={{ mt: 2, mb: 3 }}>
            {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
          </Typography>
          <form onSubmit={submit}>
            <Stack spacing={2}>
              {mode === 'register' && (
                <TextField
                  label="Имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                />
              )}
              <TextField
                label="Электронная почта"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                inputProps={{ minLength: 6 }}
              />
              <Button type="submit" variant="contained" size="large">
                {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </Button>
            </Stack>
          </form>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
          >
            {mode === 'login'
              ? 'Нет аккаунта? Зарегистрироваться'
              : 'Уже есть аккаунт? Войти'}
          </Button>
          <Divider sx={{ my: 2 }}>или</Divider>
          <Button fullWidth component={Link} to="/" variant="outlined">
            Продолжить без аккаунта
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}

// Профиль текущей сессии; без входа перенаправляем на форму авторизации.
function Profile() {
  const { user, setUser } = useApp()
  if (!user) return <Navigate to="/auth" replace />
  return (
    <Container maxWidth="md" className="main">
      <Typography variant="h2">Личный кабинет</Typography>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 54, height: 54 }}>
              {user[0].toUpperCase()}
            </Avatar>
            <div>
              <Typography variant="h3">{user}</Typography>

            </div>
          </Stack>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h3">История обработок</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            История появится после подключения backend и базы данных.
          </Typography>
          <Button component={Link} to="/" variant="contained" startIcon={<Add />}>
            Обработать файл
          </Button>
          <Button sx={{ ml: 1 }} startIcon={<Logout />} onClick={() => setUser(null)}>
            Выйти
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}

// Общий экран для проверки и экспорта, когда файл ещё не загружен.
function Empty({ title, detail }: { title: string; detail: string }) {
  const { pathname } = useLocation()
  const pageClass = pathname === '/export' ? 'export-page' : 'review-page'
  return (
    <Container maxWidth="sm" className={`main empty-page ${pageClass}`}>
      <Card>
        <CardContent sx={{ p: 5, textAlign: 'center' }}>
          <InsertDriveFileOutlined color="primary" sx={{ fontSize: 50 }} />
          <Typography variant="h3" sx={{ mt: 2 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ my: 2 }}>
            {detail}
          </Typography>
          <Button component={Link} to="/" variant="contained">
            Перейти к загрузке
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}



createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Provider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/review" element={<Review />} />
              <Route path="/export" element={<Export />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Provider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)

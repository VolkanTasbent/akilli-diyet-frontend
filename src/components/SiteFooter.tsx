type Props = {
  /** Auth sayfalarında daha sıkı boşluk */
  variant?: 'default' | 'auth'
}

const GITHUB = 'https://github.com/VolkanTasbent'

export function SiteFooter({ variant = 'default' }: Props) {
  const cls = variant === 'auth' ? 'site-footer site-footer--auth' : 'site-footer'
  return (
    <footer className={cls}>
      <p className="site-footer-text muted small">
        Created by{' '}
        <a href={GITHUB} target="_blank" rel="noreferrer noopener">
          Volkan Taşbent
        </a>
      </p>
    </footer>
  )
}

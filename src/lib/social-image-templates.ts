/**
 * Template Satori per grafiche social verticali (1080×1920, 9:16)
 * Usati per Instagram Stories, Facebook, LinkedIn
 */

// Tipo A — Citazione su sfondo branded
export function quoteTemplate(opts: {
  testo: string;
  autore?: string;
  siteUrl: string;
}) {
  const { testo, autore = 'Marco Munich', siteUrl } = opts;
  const fontSize = testo.length > 200 ? 38 : testo.length > 120 ? 44 : 52;

  return {
    type: 'div',
    props: {
      style: {
        width: '1080px',
        height: '1920px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #1a1a2e 100%)',
        padding: '80px',
        fontFamily: 'Host Grotesk',
      },
      children: [
        // Accent line top
        {
          type: 'div',
          props: {
            style: {
              width: '100px',
              height: '5px',
              background: '#f59e0b',
              borderRadius: '3px',
              marginBottom: '60px',
            },
          },
        },
        // Quote text
        {
          type: 'div',
          props: {
            style: {
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              color: '#f8fafc',
              textAlign: 'center',
              lineHeight: 1.4,
              maxWidth: '900px',
              letterSpacing: '-0.02em',
            },
            children: `\u201C${testo}\u201D`,
          },
        },
        // Spacer
        {
          type: 'div',
          props: { style: { flex: 1, minHeight: '40px', maxHeight: '80px' } },
        },
        // Author section
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '20px',
            },
            children: [
              // Author initial circle
              {
                type: 'div',
                props: {
                  style: {
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#0f172a',
                  },
                  children: 'M',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '22px', color: '#e2e8f0', fontWeight: 700 },
                        children: autore,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '18px', color: '#64748b', marginTop: '4px' },
                        children: 'Personal Branding Olistico',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // URL bar at bottom
        {
          type: 'div',
          props: {
            style: {
              marginTop: '60px',
              padding: '14px 28px',
              background: 'rgba(245,158,11,0.15)',
              borderRadius: '12px',
              border: '1px solid rgba(245,158,11,0.3)',
            },
            children: {
              type: 'div',
              props: {
                style: { fontSize: '18px', color: '#f59e0b', fontWeight: 700 },
                children: siteUrl,
              },
            },
          },
        },
      ],
    },
  };
}

// Tipo B — Immagine articolo + titolo overlay
export function titleOverlayTemplate(opts: {
  titolo: string;
  siteUrl: string;
}) {
  const { titolo, siteUrl } = opts;
  const fontSize = titolo.length > 80 ? 42 : titolo.length > 50 ? 48 : 56;

  return {
    type: 'div',
    props: {
      style: {
        width: '1080px',
        height: '1920px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        padding: '80px',
        fontFamily: 'Host Grotesk',
      },
      children: [
        // Top branding
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '80px',
              left: '80px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#0f172a',
                  },
                  children: 'M',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '20px', color: '#94a3b8' },
                  children: 'marcomunich.com',
                },
              },
            ],
          },
        },
        // Large decorative accent
        {
          type: 'div',
          props: {
            style: {
              width: '120px',
              height: '6px',
              background: '#f59e0b',
              borderRadius: '3px',
              marginBottom: '40px',
            },
          },
        },
        // Title
        {
          type: 'div',
          props: {
            style: {
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.3,
              maxWidth: '920px',
              letterSpacing: '-0.02em',
            },
            children: titolo,
          },
        },
        // Subtitle
        {
          type: 'div',
          props: {
            style: {
              fontSize: '22px',
              color: '#94a3b8',
              marginTop: '24px',
              lineHeight: 1.5,
            },
            children: 'Leggi l\'articolo completo',
          },
        },
        // URL bar
        {
          type: 'div',
          props: {
            style: {
              marginTop: '40px',
              padding: '16px 28px',
              background: 'rgba(245,158,11,0.15)',
              borderRadius: '12px',
              border: '1px solid rgba(245,158,11,0.3)',
              alignSelf: 'flex-start',
            },
            children: {
              type: 'div',
              props: {
                style: { fontSize: '20px', color: '#f59e0b', fontWeight: 700 },
                children: siteUrl,
              },
            },
          },
        },
      ],
    },
  };
}

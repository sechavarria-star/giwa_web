/* Portal GIWA Demo Telegram.
   Visitante: public.demo_portal (clave publicable, sin login).
   Solapa GIWA: login con Google + public.demo_admin (sólo cuentas @giwa-ia.com confirmadas; lo valida la base). */
(function () {
  var CFG = {
    url: 'https://ofhiogczijhzkuqdjwvz.supabase.co',
    key: 'sb_publishable_sHdrgf8l6HwnKgK38gWnFQ_fEEVgG4f',   // publicable: va en el navegador a propósito
    bot: 'GiwaDemoBot'
  };
  var $ = function (id) { return document.getElementById(id); };
  var GUARDA = 'giwa-demo-tg';

  function guardar(v) { try { v ? localStorage.setItem(GUARDA, JSON.stringify(v)) : localStorage.removeItem(GUARDA); } catch (e) {} }
  function leer() { try { return JSON.parse(localStorage.getItem(GUARDA) || 'null'); } catch (e) { return null; } }

  function nodo(tag, clase, texto) {
    var el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto != null) el.textContent = texto;
    return el;
  }
  function dosD(n) { return (n < 10 ? '0' : '') + n; }
  function fechaHora(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return dosD(d.getDate()) + '/' + dosD(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + dosD(d.getHours()) + ':' + dosD(d.getMinutes());
  }
  function aviso(el, texto, ok) { el.textContent = texto || ''; el.classList.toggle('ok', !!ok); el.hidden = !texto; }

  function portal(accion, datos) {
    return fetch(CFG.url + '/rest/v1/rpc/demo_portal', {
      method: 'POST',
      headers: { apikey: CFG.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: accion, datos: datos || {} })
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  /* ── Pestañas ─────────────────────────────────────────────── */
  var TABS = ['demos', 'comparar', 'telegram', 'giwa'];
  function irTab(t) {
    if (TABS.indexOf(t) < 0) t = 'demos';
    document.querySelectorAll('.ptab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
    TABS.forEach(function (x) { $('tab-' + x).hidden = x !== t; });
    if (t === 'giwa') admin.abrir();
  }
  document.querySelectorAll('.ptab').forEach(function (b) {
    b.addEventListener('click', function () { history.replaceState(null, '', '#' + b.dataset.tab); irTab(b.dataset.tab); });
  });

  /* ── Rubros ───────────────────────────────────────────────── */
  var RUBROS = [
    { id: 'oficina', nombre: 'Oficina y tareas', desc: 'Tareas, responsables, comentarios con menciones, alertas y agenda de un equipo de cinco personas. Un Kanban dentro del chat.', activa: true,
      lead: 'Vas a ser Laura Ríos, coordinadora de Estudio Norte, un estudio de arquitectura ficticio. Dejanos tus datos y conectá tu Telegram.' },
    { id: 'consultorio', nombre: 'Consultorio clínico', desc: 'Pacientes, médicos, turnos, obras sociales y coberturas de ejemplo.' },
    { id: 'talleres', nombre: 'Talleres', desc: 'Turnos de service, estado del vehículo y avisos de retiro.' },
    { id: 'deportes', nombre: 'Deportes', desc: 'Torneos, fixture, carga de resultados y recordatorios de partidos.' },
    { id: 'eventos', nombre: 'Organización de eventos', desc: 'Planificación, gastos, proveedores y seguimiento.' },
    { id: 'hogar', nombre: 'Organización del hogar', desc: 'Tareas de la casa, compras, gastos y agenda familiar.' }
  ];
  var PRUEBAS = [
    ['Tocá <b>Mis tareas</b> y abrí la #2.', 'Es una tarea compartida con Martín.'],
    ['Tocá <b>Tablero</b>.', 'El equipo por columnas, como un Kanban.'],
    ['Cambiá el estado de una tarea con <b>Empezar</b> o <b>Finalizar</b>.', 'El mismo mensaje se actualiza.'],
    ['Tocá <b>Comentar</b> y escribí un comentario con <b>@Martín</b>.', 'La mención le avisa.'],
    ['Creá una tarea con <b>Nueva tarea</b> y asignala a dos personas.', ''],
    ['Abrí <b>Alertas</b>.', 'Vencidas, las que vencen hoy y quién te mencionó.'],
    ['En una tarea, tocá <b>Recordarme</b> y elegí <b>En 1 minuto</b>.', 'Te llega el aviso sin costo por mensaje.'],
    ['Mirá la <b>Agenda</b> de la semana y tocá <b>Equipo</b>.', '']
  ];

  var rubro = null, sesion = leer(), sondeo = null;

  RUBROS.forEach(function (r) {
    var c = nodo('article', 'rubro');
    c.appendChild(nodo('h2', '', r.nombre));
    c.appendChild(nodo('p', '', r.desc));
    var pie = nodo('div', 'pie-rubro');
    if (r.activa) {
      var b = nodo('button', 'btn bp', 'Probar');
      b.type = 'button';
      b.addEventListener('click', function () { elegir(r); });
      pie.appendChild(b);
    } else {
      pie.appendChild(nodo('span', 'prox', 'Próximamente'));
    }
    c.appendChild(pie);
    $('rubros').appendChild(c);
  });

  PRUEBAS.forEach(function (p) {
    var li = document.createElement('li');
    li.innerHTML = p[0] + (p[1] ? ' <span>' + p[1] + '</span>' : '');
    $('pruebas').appendChild(li);
  });

  function paso(id) {
    ['paso-rubros', 'paso-datos', 'paso-telegram', 'paso-listo'].forEach(function (x) { $(x).hidden = x !== id; });
    if (id !== 'paso-telegram' && sondeo) { clearInterval(sondeo); sondeo = null; }
    window.scrollTo(0, 0);
  }

  function elegir(r) {
    rubro = r;
    if (sesion && sesion.rubro === r.id) return seguir();
    $('rubro-titulo').textContent = r.nombre;
    $('rubro-lead').textContent = r.lead;
    aviso($('e-datos'), '');
    paso('paso-datos');
    $('nombre').focus();
  }

  document.querySelectorAll('[data-volver]').forEach(function (b) { b.addEventListener('click', function () { paso('paso-rubros'); }); });

  $('f-datos').addEventListener('submit', function (e) {
    e.preventDefault();
    var boton = e.target.querySelector('[type=submit]');
    boton.disabled = true;
    aviso($('e-datos'), '');
    portal('crear', { rubro: rubro.id, nombre: $('nombre').value, mail: $('mail').value, consiente: $('consiente').checked })
      .then(function (r) {
        if (!r.ok) return aviso($('e-datos'), r.error);
        sesion = { token: r.token, rubro: rubro.id, vence: r.vence };
        guardar(sesion);
        esperar();
      })
      .catch(function () { aviso($('e-datos'), 'No pudimos conectarnos. Probá de nuevo en un rato.'); })
      .finally(function () { boton.disabled = false; });
  });

  function enlace() { return 'https://t.me/' + CFG.bot + '?start=' + sesion.token; }

  function esperar() {
    $('abrir-tg').href = enlace();
    $('enlace-tg').textContent = enlace();
    paso('paso-telegram');
    sondeo = setInterval(revisar, 3000);
  }

  function revisar() {
    return portal('estado', { token: sesion.token }).then(function (r) {
      if (!r.ok || !r.activa) { sesion = null; guardar(null); paso('paso-rubros'); return; }
      sesion.vence = r.vence;
      if (r.vinculado) listo(r);
    }).catch(function () {});
  }

  function listo(r) {
    $('tg-nombre').textContent = r.tg_nombre || 'tu Telegram';
    $('vence').textContent = fechaHora(sesion.vence);
    $('abrir-tg-2').href = 'https://t.me/' + CFG.bot;
    aviso($('e-listo'), '');
    paso('paso-listo');
  }

  // Volver a la demo que ya estaba abierta en este navegador
  function seguir() {
    portal('estado', { token: sesion.token }).then(function (r) {
      if (!r.ok || !r.activa) { sesion = null; guardar(null); if (rubro) elegir(rubro); return; }
      sesion.vence = r.vence;
      r.vinculado ? listo(r) : esperar();
    }).catch(function () { paso('paso-rubros'); });
  }

  $('reiniciar').addEventListener('click', function () {
    var b = this;
    b.disabled = true;
    portal('reiniciar', { token: sesion.token })
      .then(function (r) { aviso($('e-listo'), r.ok ? 'Listo: los datos volvieron al inicio. Te avisamos en Telegram.' : r.error, r.ok); })
      .catch(function () { aviso($('e-listo'), 'No pudimos reiniciar. Probá de nuevo.'); })
      .finally(function () { b.disabled = false; });
  });

  /* ── WhatsApp vs. Telegram ────────────────────────────────── */
  var COMPARA = [
    ['Costo por mensaje', 'Meta cobra por mensaje: 1.000 de servicio gratis por mes y USD 0,026 por cada uno que exceda y por cada plantilla.', 'Sin costo por mensaje, sin importar el volumen.', 'tg'],
    ['Ventana de conversación', 'Pasadas 24 horas desde el último mensaje del cliente, sólo se puede escribir con plantillas pagas.', 'Sin ventana: el bot escribe cuando hace falta, mientras la persona no lo bloquee.', 'tg'],
    ['Plantillas', 'Cada mensaje fuera de la ventana necesita una plantilla aprobada por Meta.', 'No existen: cualquier texto, en cualquier momento.', 'tg'],
    ['Alta del canal', 'Cuenta de Meta Business, verificación de la empresa y un número de teléfono dedicado.', 'Un token de @BotFather en minutos, sin número de teléfono.', 'tg'],
    ['Botones', 'Hasta 3 botones de respuesta o una lista de hasta 10 opciones.', 'Menús con muchos botones en filas, que cambian al tocarlos.', 'tg'],
    ['Mensajes que se actualizan', 'Lo enviado queda como está: cada cambio es un mensaje nuevo.', 'El bot reescribe el mismo mensaje: una lista se convierte en ficha y vuelve.', 'tg'],
    ['Apps dentro del chat', 'WhatsApp Flows: formularios paso a paso.', 'Mini Apps: una web completa dentro de Telegram.', 'tg'],
    ['Grupos y canales', 'El uso de bots en grupos es acotado.', 'Bots en grupos de hasta 200.000 personas y canales sin límite.', 'tg'],
    ['Primer contacto', 'La empresa puede escribir primero a un número, con una plantilla aprobada y consentimiento.', 'La persona tiene que abrir el bot y tocar Iniciar: no se le puede escribir a un teléfono.', 'wa'],
    ['Alcance', 'Lo usa casi toda la población.', 'Menos difundido: hay que invitar a abrirlo.', 'wa'],
    ['Empresa verificada', 'Insignia de negocio verificado.', 'No hay una insignia de empresa estándar: el bot se identifica por su @usuario.', 'wa'],
    ['Servidor, automatización e IA', 'Se pagan aparte.', 'Se pagan igual.', 'igual']
  ];
  var GANA = { tg: ['g-tg', 'Telegram'], wa: ['g-wa', 'WhatsApp'], igual: ['g-igual', 'Igual'] };
  COMPARA.forEach(function (f) {
    var tr = document.createElement('tr');
    tr.appendChild(nodo('td', '', f[0]));
    var wa = nodo('td'); wa.innerHTML = f[1].replace(/(\d[\d.,]*)/g, '<span class="num">$1</span>'); tr.appendChild(wa);
    var tg = nodo('td'); tg.innerHTML = f[2].replace(/(\d[\d.,]*)/g, '<span class="num">$1</span>'); tr.appendChild(tg);
    var g = nodo('td'); g.appendChild(nodo('span', 'gana ' + GANA[f[3]][0], GANA[f[3]][1])); tr.appendChild(g);
    $('comparativa').appendChild(tr);
  });

  /* ── Telegram ─────────────────────────────────────────────── */
  var TG = {
    'tg-claves': [
      ['Botones bajo cada mensaje', 'Acciones de un toque: confirmar, cambiar estado, elegir fecha.'],
      ['Menú fijo', 'Un teclado propio debajo del chat con las opciones principales.'],
      ['Comandos', 'Atajos como /ayuda o /reiniciar, con su lista a mano.'],
      ['Mensajes que se reescriben', 'Una lista pasa a ficha y vuelve, sin llenar el chat.'],
      ['Avisos y recordatorios', 'El bot escribe cuando hace falta, sin costo por mensaje.'],
      ['Archivos, fotos y ubicación', 'Documentos, imágenes, audios y ubicaciones en el mismo chat.']
    ],
    'tg-perso': [
      ['Nombre, foto y descripción', 'El bot se presenta con la marca de la empresa.'],
      ['Presentación antes de empezar', 'Un texto que se ve antes de tocar Iniciar.'],
      ['Botón de menú', 'Puede abrir la lista de comandos o una web propia.'],
      ['Formato del texto', 'Negrita, cursiva, citas, enlaces y texto oculto.'],
      ['Colores', 'El chat respeta los colores que eligió cada persona. Una Mini App sí usa los colores de la marca y se adapta al modo claro u oscuro.']
    ],
    'tg-oculto': [
      ['Enlaces con contexto', 'Un enlace puede abrir el bot ya ubicado en una demo, un turno o un pedido. Así funciona este portal.'],
      ['Mini Apps', 'Pantallas completas, como un tablero o un formulario, sin salir de Telegram.'],
      ['Sin compartir el teléfono', 'La persona no expone su número. Si hace falta, el bot lo pide con un botón.'],
      ['Avisos silenciosos', 'Mensajes que llegan sin sonido, para lo que no es urgente.'],
      ['Respuestas al toque', 'Un cartelito confirma la acción sin sumar mensajes al chat.'],
      ['Telegram Business', 'Un bot puede responder desde la cuenta personal de la empresa (requiere Premium).'],
      ['Bots en grupos', 'El mismo bot puede trabajar en un grupo de equipo o en uno por cliente.']
    ]
  };
  Object.keys(TG).forEach(function (id) {
    TG[id].forEach(function (x) { $(id).appendChild(nodo('dt', '', x[0])); $(id).appendChild(nodo('dd', '', x[1])); });
  });

  /* ── Solapa GIWA ──────────────────────────────────────────── */
  var admin = (function () {
    var sb = null, cargado = false;
    function cliente() {
      if (!sb && window.supabase) sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, detectSessionInUrl: true } });
      return sb;
    }
    function llamar(accion, datos) {
      return cliente().rpc('demo_admin', { accion: accion, datos: datos || {} }).then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
    }
    function vista(id) { ['adm-entrar', 'adm-negado', 'adm-panel'].forEach(function (x) { $(x).hidden = x !== id; }); }

    function abrir() {
      if (!cliente()) { vista('adm-entrar'); aviso($('e-adm'), 'No se pudo cargar el inicio de sesión.'); return; }
      cliente().auth.getSession().then(function (s) {
        if (!s.data.session) return vista('adm-entrar');
        $('adm-quien').textContent = s.data.session.user.email;
        estado();
      });
    }

    function estado() {
      llamar('estado').then(function (r) {
        if (!r.ok) { vista('adm-negado'); return; }
        vista('adm-panel');
        $('st-bot').textContent = r.bot_token ? 'Cargado' : 'Falta';
        $('st-bot').className = r.bot_token ? 'st-ok' : 'st-falta';
        $('st-gemini').textContent = r.gemini ? 'Cargada' : 'Falta';
        $('st-gemini').className = r.gemini ? 'st-ok' : 'st-falta';
        $('portal_url').placeholder = r.portal_url || 'https://…';
        var ul = $('st-errores'); ul.textContent = '';
        (r.errores || []).forEach(function (e) {
          var li = nodo('li');
          li.appendChild(nodo('span', 'num', fechaHora(e.creado) + ' · ' + e.status));
          li.appendChild(document.createTextNode(' ' + e.metodo + ': ' + (e.detalle || '')));
          ul.appendChild(li);
        });
        if (!ul.children.length) ul.appendChild(nodo('li', '', 'Sin errores recientes.'));
        if (!cargado) leads();
      }).catch(function () { vista('adm-negado'); });
    }

    function leads() {
      llamar('leads').then(function (r) {
        if (!r.ok) return;
        cargado = true;
        var tb = $('leads'); tb.textContent = '';
        $('leads-n').textContent = r.leads.length;
        r.leads.forEach(function (l) {
          var tr = document.createElement('tr');
          tr.appendChild(nodo('td', 'num', fechaHora(l.creado)));
          tr.appendChild(nodo('td', '', l.nombre));
          tr.appendChild(nodo('td', '', l.mail));
          tr.appendChild(nodo('td', '', l.rubro));
          tr.appendChild(nodo('td', '', l.tg_nombre ? l.tg_nombre + (l.tg_usuario ? ' (@' + l.tg_usuario + ')' : '') : 'Sin conectar'));
          tr.appendChild(nodo('td', 'num', l.tg_id || ''));
          tb.appendChild(tr);
        });
        if (!r.leads.length) { var tr = document.createElement('tr'); var td = nodo('td', '', 'Todavía no hay leads.'); td.colSpan = 6; tr.appendChild(td); tb.appendChild(tr); }
      });
    }

    $('adm-google').addEventListener('click', function () {
      cliente().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname + '#giwa' } });
    });
    $('adm-salir').addEventListener('click', function () { cliente().auth.signOut().then(function () { cargado = false; vista('adm-entrar'); }); });
    $('adm-salir-2').addEventListener('click', function () { cliente().auth.signOut().then(function () { vista('adm-entrar'); }); });
    $('adm-recargar').addEventListener('click', function () { cargado = false; estado(); });

    document.querySelectorAll('[data-guardar]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var campo = f.querySelector('input'), boton = f.querySelector('button');
        boton.disabled = true;
        llamar('guardar', { clave: campo.name, valor: campo.value })
          .then(function (r) { aviso($('e-config'), r.ok ? 'Guardado.' : r.error, r.ok); if (r.ok) { campo.value = ''; estado(); } })
          .catch(function () { aviso($('e-config'), 'No se pudo guardar.'); })
          .finally(function () { boton.disabled = false; });
      });
    });

    $('adm-conectar').addEventListener('click', function () {
      var b = this; b.disabled = true;
      llamar('conectar')
        .then(function (r) { aviso($('e-config'), r.ok ? 'Listo: el bot quedó conectado. Revisá «Últimos errores» en unos segundos.' : r.error, r.ok); setTimeout(estado, 4000); })
        .catch(function () { aviso($('e-config'), 'No se pudo conectar.'); })
        .finally(function () { b.disabled = false; });
    });

    return { abrir: abrir };
  })();

  /* ── Arranque ─────────────────────────────────────────────── */
  window.addEventListener('hashchange', function () { irTab(location.hash.slice(1)); });
  irTab((location.hash || '#demos').slice(1));
  if (sesion && location.hash !== '#giwa') {
    rubro = RUBROS.filter(function (r) { return r.id === sesion.rubro; })[0] || null;
    if (rubro) seguir();
  }
})();

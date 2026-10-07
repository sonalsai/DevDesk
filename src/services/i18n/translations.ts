export type SupportedLocale = 'en' | 'es' | 'ja' | 'de' | 'fr' | 'zh' | 'hi';

export interface LocaleMeta {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', direction: 'ltr' },
];

export interface TranslationDictionary {
  // Navigation & Shell
  nav: {
    home: string;
    scratchpad: string;
    tasks: string;
    projects: string;
    apiClient: string;
    graphql: string;
    websocket: string;
    sse: string;
    collections: string;
    environments: string;
    mockServer: string;
    openapi: string;
    webhooks: string;
    httpInspector: string;
    git: string;
    ssh: string;
    logs: string;
    yamlToolkit: string;
    allTools: string;
    favorites: string;
    recent: string;
    snippets: string;
    settings: string;
    docs: string;
  };
  // TopBar
  topbar: {
    searchPlaceholder: string;
    toggleTheme: string;
    shortcuts: string;
    privacy: string;
    settings: string;
    guide: string;
    online: string;
    offline: string;
    storageUsed: string;
    systemHealth: string;
    back: string;
  };
  // Dashboard
  dashboard: {
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    heroSubtitle: string;
    pendingTasks: string;
    activeProjects: string;
    savedSnippets: string;
    favorites: string;
    quickAccess: string;
    allToolsLink: string;
    recentActivity: string;
    noRecentActivity: string;
    newTask: string;
    openGuide: string;
  };
  // Actions & Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    copy: string;
    copied: string;
    import: string;
    export: string;
    run: string;
    clear: string;
    filter: string;
    search: string;
    loading: string;
    success: string;
    error: string;
    warning: string;
    status: string;
    name: string;
    actions: string;
    close: string;
  };
  // Settings
  settings: {
    title: string;
    subtitle: string;
    appearance: string;
    language: string;
    theme: string;
    themeDark: string;
    themeLight: string;
    themeSystem: string;
    storageSection: string;
    storageDesc: string;
    storageUsedLabel: string;
    storageQuotaLabel: string;
    backupSection: string;
    exportBackup: string;
    importBackup: string;
    resetWorkspace: string;
    systemHealthTitle: string;
  };
  // API & Runner
  api: {
    send: string;
    cancel: string;
    batchRunner: string;
    runCollection: string;
    exportPostman: string;
    importPostman: string;
    importHar: string;
    exportHar: string;
  };
}

export const translations: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    nav: {
      home: 'Home',
      scratchpad: 'Scratchpad',
      tasks: 'Tasks',
      projects: 'Projects',
      apiClient: 'API Client',
      graphql: 'GraphQL',
      websocket: 'WebSocket',
      sse: 'SSE',
      collections: 'Collections',
      environments: 'Environments',
      mockServer: 'Mock Server',
      openapi: 'OpenAPI',
      webhooks: 'Webhooks',
      httpInspector: 'HTTP Inspector',
      git: 'Git',
      ssh: 'SSH',
      logs: 'Logs',
      yamlToolkit: 'YAML Toolkit',
      allTools: 'All Tools',
      favorites: 'Favorites',
      recent: 'Recent',
      snippets: 'Snippets',
      settings: 'Settings',
      docs: 'Documentation',
    },
    topbar: {
      searchPlaceholder: 'Search tools, snippets, projects...',
      toggleTheme: 'Toggle theme',
      shortcuts: 'Keyboard shortcuts',
      privacy: '100% Local-first privacy',
      settings: 'Settings',
      guide: 'App Overview & Guide',
      online: 'Online',
      offline: 'Offline (Local)',
      storageUsed: 'Storage',
      systemHealth: 'System Health',
      back: 'Back',
    },
    dashboard: {
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
      heroSubtitle: 'Production-grade, privacy-first developer cockpit. All data stays local in your browser.',
      pendingTasks: 'Pending tasks',
      activeProjects: 'Active projects',
      savedSnippets: 'Saved snippets',
      favorites: 'Favorites',
      quickAccess: 'Quick Utilities',
      allToolsLink: 'View all 15 utilities',
      recentActivity: 'Recent Activity',
      noRecentActivity: 'No recent activity recorded yet.',
      newTask: 'New Task',
      openGuide: 'Interactive Guide',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      copy: 'Copy',
      copied: 'Copied!',
      import: 'Import',
      export: 'Export',
      run: 'Run',
      clear: 'Clear',
      filter: 'Filter',
      search: 'Search',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      status: 'Status',
      name: 'Name',
      actions: 'Actions',
      close: 'Close',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Configure application appearance, language, storage limits, and workspace integrity.',
      appearance: 'Appearance & Locale',
      language: 'Language & Internationalization',
      theme: 'Interface Theme',
      themeDark: 'Dark',
      themeLight: 'Light',
      themeSystem: 'System',
      storageSection: 'Storage Engine & Quota Sentinel',
      storageDesc: 'Monitor browser storage usage, verify SHA-256 backup integrity, and manage local data safely.',
      storageUsedLabel: 'Storage Used',
      storageQuotaLabel: 'Available Browser Quota',
      backupSection: 'Workspace Data & Interoperability',
      exportBackup: 'Export Workspace JSON',
      importBackup: 'Import Workspace Backup',
      resetWorkspace: 'Reset Workspace Data',
      systemHealthTitle: 'Core Web Vitals & Runtime Health',
    },
    api: {
      send: 'Send',
      cancel: 'Cancel',
      batchRunner: 'Batch Collection Runner',
      runCollection: 'Run Collection',
      exportPostman: 'Export Postman v2.1',
      importPostman: 'Import Postman Collection',
      importHar: 'Import HAR File',
      exportHar: 'Export HAR',
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      scratchpad: 'Notas rápidas',
      tasks: 'Tareas',
      projects: 'Proyectos',
      apiClient: 'Cliente API',
      graphql: 'GraphQL',
      websocket: 'WebSocket',
      sse: 'SSE',
      collections: 'Colecciones',
      environments: 'Entornos',
      mockServer: 'Servidor Mock',
      openapi: 'OpenAPI',
      webhooks: 'Webhooks',
      httpInspector: 'Inspector HTTP',
      git: 'Git',
      ssh: 'SSH',
      logs: 'Registros',
      yamlToolkit: 'Herramientas YAML',
      allTools: 'Todas las herramientas',
      favorites: 'Favoritos',
      recent: 'Reciente',
      snippets: 'Fragmentos',
      settings: 'Configuración',
      docs: 'Documentación',
    },
    topbar: {
      searchPlaceholder: 'Buscar herramientas, fragmentos, proyectos...',
      toggleTheme: 'Cambiar tema',
      shortcuts: 'Atajos de teclado',
      privacy: 'Privacidad 100% local',
      settings: 'Configuración',
      guide: 'Guía y resumen',
      online: 'En línea',
      offline: 'Desconectado (Local)',
      storageUsed: 'Almacenamiento',
      systemHealth: 'Salud del sistema',
      back: 'Volver',
    },
    dashboard: {
      greetingMorning: 'Buenos días',
      greetingAfternoon: 'Buenas tardes',
      greetingEvening: 'Buenas noches',
      heroSubtitle: 'Cabina de desarrollo de nivel de producción. Todos los datos permanecen en su navegador.',
      pendingTasks: 'Tareas pendientes',
      activeProjects: 'Proyectos activos',
      savedSnippets: 'Fragmentos guardados',
      favorites: 'Favoritos',
      quickAccess: 'Utilidades rápidas',
      allToolsLink: 'Ver las 15 utilidades',
      recentActivity: 'Actividad reciente',
      noRecentActivity: 'Aún no hay actividad reciente registrada.',
      newTask: 'Nueva tarea',
      openGuide: 'Guía interactiva',
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      copy: 'Copiar',
      copied: '¡Copiado!',
      import: 'Importar',
      export: 'Exportar',
      run: 'Ejecutar',
      clear: 'Limpiar',
      filter: 'Filtrar',
      search: 'Buscar',
      loading: 'Cargando...',
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      status: 'Estado',
      name: 'Nombre',
      actions: 'Acciones',
      close: 'Cerrar',
    },
    settings: {
      title: 'Configuración',
      subtitle: 'Configure apariencia, idioma, límites de almacenamiento e integridad del espacio de trabajo.',
      appearance: 'Apariencia e Idioma',
      language: 'Idioma e Internacionalización',
      theme: 'Tema de la interfaz',
      themeDark: 'Oscuro',
      themeLight: 'Claro',
      themeSystem: 'Sistema',
      storageSection: 'Motor de almacenamiento y cuota',
      storageDesc: 'Supervise el almacenamiento del navegador, verifique la integridad SHA-256 y gestione datos.',
      storageUsedLabel: 'Almacenamiento usado',
      storageQuotaLabel: 'Cuota disponible del navegador',
      backupSection: 'Datos del espacio de trabajo e interoperabilidad',
      exportBackup: 'Exportar JSON del espacio',
      importBackup: 'Importar copia de seguridad',
      resetWorkspace: 'Restablecer datos',
      systemHealthTitle: 'Métricas web clave y rendimiento',
    },
    api: {
      send: 'Enviar',
      cancel: 'Cancelar',
      batchRunner: 'Ejecutor por lotes de colección',
      runCollection: 'Ejecutar colección',
      exportPostman: 'Exportar Postman v2.1',
      importPostman: 'Importar colección Postman',
      importHar: 'Importar archivo HAR',
      exportHar: 'Exportar HAR',
    },
  },
  ja: {
    nav: {
      home: 'ホーム',
      scratchpad: 'スクラッチパッド',
      tasks: 'タスク',
      projects: 'プロジェクト',
      apiClient: 'APIクライアント',
      graphql: 'GraphQL',
      websocket: 'WebSocket',
      sse: 'SSE',
      collections: 'コレクション',
      environments: '環境変数',
      mockServer: 'モックサーバー',
      openapi: 'OpenAPI',
      webhooks: 'Webhook',
      httpInspector: 'HTTPインスペクター',
      git: 'Git',
      ssh: 'SSH',
      logs: 'ログ',
      yamlToolkit: 'YAMLツール',
      allTools: '全ツール',
      favorites: 'お気に入り',
      recent: '最近の履歴',
      snippets: 'スニペット',
      settings: '設定',
      docs: 'ドキュメント',
    },
    topbar: {
      searchPlaceholder: 'ツール、スニペット、プロジェクトを検索...',
      toggleTheme: 'テーマ切り替え',
      shortcuts: 'キーボードショートカット',
      privacy: '100%ローカルプライバシー',
      settings: '設定',
      guide: 'アプリ概要とガイド',
      online: 'オンライン',
      offline: 'オフライン (ローカル)',
      storageUsed: 'ストレージ',
      systemHealth: 'システムヘルス',
      back: '戻る',
    },
    dashboard: {
      greetingMorning: 'おはようございます',
      greetingAfternoon: 'こんにちは',
      greetingEvening: 'こんばんは',
      heroSubtitle: '本番環境水準のローカルファースト開発環境。すべてのデータは安全にブラウザ内に保持されます。',
      pendingTasks: '未完了タスク',
      activeProjects: 'アクティブなプロジェクト',
      savedSnippets: '保存済みスニペット',
      favorites: 'お気に入り',
      quickAccess: 'クイックツール',
      allToolsLink: '全15種類のツールを見る',
      recentActivity: '最近のアクティビティ',
      noRecentActivity: '最近のアクティビティはまだありません。',
      newTask: '新規タスク',
      openGuide: 'インタラクティブガイド',
    },
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      copy: 'コピー',
      copied: 'コピー完了！',
      import: 'インポート',
      export: 'エクスポート',
      run: '実行',
      clear: 'クリア',
      filter: 'フィルター',
      search: '検索',
      loading: '読み込み中...',
      success: '成功',
      error: 'エラー',
      warning: '警告',
      status: 'ステータス',
      name: '名前',
      actions: '操作',
      close: '閉じる',
    },
    settings: {
      title: '設定',
      subtitle: '外観、言語、ストレージ制限、ワークスペースの整合性を構成します。',
      appearance: '外観と言語',
      language: '表示言語と国際化',
      theme: 'インターフェーステーマ',
      themeDark: 'ダーク',
      themeLight: 'ライト',
      themeSystem: 'システム',
      storageSection: 'ストレージエンジンとクォータ監視',
      storageDesc: 'ブラウザストレージの使用量を監視し、SHA-256整合性を検証します。',
      storageUsedLabel: '使用中ストレージ',
      storageQuotaLabel: '利用可能なブラウザクォータ',
      backupSection: 'ワークスペースデータと互換性',
      exportBackup: 'ワークスペースJSONのエクスポート',
      importBackup: 'バックアップのインポート',
      resetWorkspace: 'ワークスペースの初期化',
      systemHealthTitle: 'Core Web Vitals とランタイム健全性',
    },
    api: {
      send: '送信',
      cancel: 'キャンセル',
      batchRunner: 'コレクション一括実行',
      runCollection: 'コレクション実行',
      exportPostman: 'Postman v2.1エクスポート',
      importPostman: 'Postmanコレクションのインポート',
      importHar: 'HARファイルのインポート',
      exportHar: 'HARエクスポート',
    },
  },
  de: {
    nav: {
      home: 'Startseite',
      scratchpad: 'Notizblock',
      tasks: 'Aufgaben',
      projects: 'Projekte',
      apiClient: 'API-Client',
      graphql: 'GraphQL',
      websocket: 'WebSocket',
      sse: 'SSE',
      collections: 'Sammlungen',
      environments: 'Umgebungen',
      mockServer: 'Mock-Server',
      openapi: 'OpenAPI',
      webhooks: 'Webhooks',
      httpInspector: 'HTTP-Inspektor',
      git: 'Git',
      ssh: 'SSH',
      logs: 'Protokolle',
      yamlToolkit: 'YAML-Toolkit',
      allTools: 'Alle Werkzeuge',
      favorites: 'Favoriten',
      recent: 'Verlauf',
      snippets: 'Snippets',
      settings: 'Einstellungen',
      docs: 'Dokumentation',
    },
    topbar: {
      searchPlaceholder: 'Werkzeuge, Snippets, Projekte suchen...',
      toggleTheme: 'Design umschalten',
      shortcuts: 'Tastaturkürzel',
      privacy: '100% lokaler Datenschutz',
      settings: 'Einstellungen',
      guide: 'Übersicht & Anleitung',
      online: 'Online',
      offline: 'Offline (Lokal)',
      storageUsed: 'Speicher',
      systemHealth: 'Systemzustand',
      back: 'Zurück',
    },
    dashboard: {
      greetingMorning: 'Guten Morgen',
      greetingAfternoon: 'Guten Tag',
      greetingEvening: 'Guten Abend',
      heroSubtitle: 'Produktionsreifes Entwickler-Cockpit mit absolutem Datenschutz. Alle Daten bleiben lokal.',
      pendingTasks: 'Offene Aufgaben',
      activeProjects: 'Aktive Projekte',
      savedSnippets: 'Gespeicherte Snippets',
      favorites: 'Favoriten',
      quickAccess: 'Schnellzugriff',
      allToolsLink: 'Alle 15 Werkzeuge anzeigen',
      recentActivity: 'Letzte Aktivitäten',
      noRecentActivity: 'Noch keine Aktivitäten aufgezeichnet.',
      newTask: 'Neue Aufgabe',
      openGuide: 'Interaktive Anleitung',
    },
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      copy: 'Kopieren',
      copied: 'Kopiert!',
      import: 'Importieren',
      export: 'Exportieren',
      run: 'Ausführen',
      clear: 'Leeren',
      filter: 'Filtern',
      search: 'Suchen',
      loading: 'Laden...',
      success: 'Erfolg',
      error: 'Fehler',
      warning: 'Warnung',
      status: 'Status',
      name: 'Name',
      actions: 'Aktionen',
      close: 'Schließen',
    },
    settings: {
      title: 'Einstellungen',
      subtitle: 'Erscheinungsbild, Sprache, Speicherkontingente und Datenintegrität anpassen.',
      appearance: 'Erscheinungsbild & Sprache',
      language: 'Sprache & Internationalisierung',
      theme: 'Oberflächendesign',
      themeDark: 'Dunkel',
      themeLight: 'Hell',
      themeSystem: 'System',
      storageSection: 'Speicher-Engine & Kontingentüberwachung',
      storageDesc: 'Speichernutzung überwachen, SHA-256-Integrität prüfen und Daten sicher verwalten.',
      storageUsedLabel: 'Belegter Speicher',
      storageQuotaLabel: 'Verfügbares Browserextingent',
      backupSection: 'Arbeitsbereichsdaten & Interoperabilität',
      exportBackup: 'Arbeitsbereich-JSON exportieren',
      importBackup: 'Sicherung importieren',
      resetWorkspace: 'Arbeitsbereich zurücksetzen',
      systemHealthTitle: 'Core Web Vitals & Systemleistung',
    },
    api: {
      send: 'Senden',
      cancel: 'Abbrechen',
      batchRunner: 'Batch-Sammlungs-Runner',
      runCollection: 'Sammlung ausführen',
      exportPostman: 'Postman v2.1 exportieren',
      importPostman: 'Postman-Sammlung importieren',
      importHar: 'HAR-Datei importieren',
      exportHar: 'HAR exportieren',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      scratchpad: 'Bloc-notes',
      tasks: 'Tâches',
      projects: 'Projets',
      apiClient: 'Client API',
      graphql: 'GraphQL',
      websocket: 'WebSocket',
      sse: 'SSE',
      collections: 'Collections',
      environments: 'Environnements',
      mockServer: 'Serveur simulé',
      openapi: 'OpenAPI',
      webhooks: 'Webhooks',
      httpInspector: 'Inspecteur HTTP',
      git: 'Git',
      ssh: 'SSH',
      logs: 'Journaux',
      yamlToolkit: 'Outils YAML',
      allTools: 'Tous les outils',
      favorites: 'Favoris',
      recent: 'Récents',
      snippets: 'Extraits',
      settings: 'Paramètres',
      docs: 'Documentation',
    },
    topbar: {
      searchPlaceholder: 'Rechercher des outils, extraits, projets...',
      toggleTheme: 'Changer de thème',
      shortcuts: 'Raccourcis clavier',
      privacy: 'Confidentialité 100% locale',
      settings: 'Paramètres',
      guide: 'Guide et aperçu',
      online: 'En ligne',
      offline: 'Hors ligne (Local)',
      storageUsed: 'Stockage',
      systemHealth: 'Santé système',
      back: 'Retour',
    },
    dashboard: {
      greetingMorning: 'Bonjour',
      greetingAfternoon: 'Bon après-midi',
      greetingEvening: 'Bonsoir',
      heroSubtitle: 'Cockpit développeur de niveau production. Toutes vos données restent dans votre navigateur.',
      pendingTasks: 'Tâches en attente',
      activeProjects: 'Projets actifs',
      savedSnippets: 'Extraits sauvegardés',
      favorites: 'Favoris',
      quickAccess: 'Utilitaires rapides',
      allToolsLink: 'Voir les 15 utilitaires',
      recentActivity: 'Activité récente',
      noRecentActivity: 'Aucune activité récente enregistrée.',
      newTask: 'Nouvelle tâche',
      openGuide: 'Guide interactif',
    },
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      copy: 'Copier',
      copied: 'Copié !',
      import: 'Importer',
      export: 'Exporter',
      run: 'Exécuter',
      clear: 'Effacer',
      filter: 'Filtrer',
      search: 'Rechercher',
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      warning: 'Avertissement',
      status: 'Statut',
      name: 'Nom',
      actions: 'Actions',
      close: 'Fermer',
    },
    settings: {
      title: 'Paramètres',
      subtitle: 'Configurez apparence, langue, quotas de stockage et intégrité des données.',
      appearance: 'Apparence et langue',
      language: 'Langue et internationalisation',
      theme: 'Thème d’interface',
      themeDark: 'Sombre',
      themeLight: 'Clair',
      themeSystem: 'Système',
      storageSection: 'Moteur de stockage et sentinelle de quota',
      storageDesc: 'Surveillez le stockage, vérifiez l’intégrité SHA-256 et sécurisez vos données.',
      storageUsedLabel: 'Stockage utilisé',
      storageQuotaLabel: 'Quota navigateur disponible',
      backupSection: 'Données d’espace et interopérabilité',
      exportBackup: 'Exporter le JSON d’espace',
      importBackup: 'Importer une sauvegarde',
      resetWorkspace: 'Réinitialiser l’espace',
      systemHealthTitle: 'Core Web Vitals & Santé en direct',
    },
    api: {
      send: 'Envoyer',
      cancel: 'Annuler',
      batchRunner: 'Exécuteur de collection par lot',
      runCollection: 'Exécuter la collection',
      exportPostman: 'Exporter Postman v2.1',
      importPostman: 'Importer collection Postman',
      importHar: 'Importer fichier HAR',
      exportHar: 'Exporter HAR',
    },
  },
  zh: {
    nav: {
      home: '首页',
      scratchpad: '便签本',
      tasks: '任务清单',
      projects: '工程项目',
      apiClient: 'API客户端',
      graphql: 'GraphQL',
      websocket: 'WebSocket',
      sse: 'SSE',
      collections: '集合管理',
      environments: '环境变量',
      mockServer: 'Mock服务',
      openapi: 'OpenAPI',
      webhooks: 'Webhooks',
      httpInspector: 'HTTP探测器',
      git: 'Git版本控制',
      ssh: 'SSH终端',
      logs: '日志中心',
      yamlToolkit: 'YAML工具箱',
      allTools: '全部工具',
      favorites: '我的收藏',
      recent: '历史记录',
      snippets: '代码片段',
      settings: '系统设置',
      docs: '帮助文档',
    },
    topbar: {
      searchPlaceholder: '搜索工具、代码片段、项目...',
      toggleTheme: '切换主题',
      shortcuts: '快捷键一览',
      privacy: '100% 本地隐私安全',
      settings: '设置',
      guide: '全局功能指南',
      online: '在线',
      offline: '离线 (本地模式)',
      storageUsed: '存储容量',
      systemHealth: '系统健康',
      back: '返回',
    },
    dashboard: {
      greetingMorning: '早上好',
      greetingAfternoon: '下午好',
      greetingEvening: '晚上好',
      heroSubtitle: '企业生产级、纯本地开发工作台。所有数据均安全保存在浏览器本地。',
      pendingTasks: '待办任务',
      activeProjects: '活跃项目',
      savedSnippets: '已存片段',
      favorites: '收藏夹',
      quickAccess: '高频工具',
      allToolsLink: '浏览全部 15 款开发者工具',
      recentActivity: '最近动态',
      noRecentActivity: '暂无最近活动记录。',
      newTask: '新建任务',
      openGuide: '交互式向导',
    },
    common: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      copy: '复制',
      copied: '已复制！',
      import: '导入',
      export: '导出',
      run: '运行',
      clear: '清空',
      filter: '筛选',
      search: '搜索',
      loading: '加载中...',
      success: '成功',
      error: '错误',
      warning: '警告',
      status: '状态',
      name: '名称',
      actions: '操作',
      close: '关闭',
    },
    settings: {
      title: '系统设置',
      subtitle: '自定义界面外观、显示语言、本地存储配额与空间完整性校验。',
      appearance: '外观与多语言',
      language: '系统语言与国际化',
      theme: '主题配色',
      themeDark: '深色模式',
      themeLight: '浅色模式',
      themeSystem: '跟随系统',
      storageSection: '存储引擎与配额哨兵',
      storageDesc: '实时监控浏览器存储用量，校验 SHA-256 完整性哈希，杜绝数据损坏。',
      storageUsedLabel: '已用空间',
      storageQuotaLabel: '可用浏览器配额',
      backupSection: '工作区备份与格式互通',
      exportBackup: '导出工作区 JSON',
      importBackup: '导入备份文件',
      resetWorkspace: '重置所有工作区数据',
      systemHealthTitle: 'Core Web Vitals 与运行时指标',
    },
    api: {
      send: '发送请求',
      cancel: '取消',
      batchRunner: '集合批量测试运行器',
      runCollection: '运行集合测试',
      exportPostman: '导出 Postman v2.1',
      importPostman: '导入 Postman 集合',
      importHar: '导入 HAR 文件',
      exportHar: '导出 HAR 文件',
    },
  },
  hi: {
    nav: {
      home: 'होम',
      scratchpad: 'नोटपैड',
      tasks: 'कार्य',
      projects: 'प्रोजेक्ट्स',
      apiClient: 'एपीआई क्लाइंट',
      graphql: 'ग्राफ़क्यूएल',
      websocket: 'वेबसॉकेट',
      sse: 'एसएसई',
      collections: 'कलेक्शंस',
      environments: 'एन्वायरनमेंट',
      mockServer: 'मॉक सर्वर',
      openapi: 'ओपनएपीआई',
      webhooks: 'वेबहूक',
      httpInspector: 'एचटीटीपी इंस्पेक्टर',
      git: 'गिट',
      ssh: 'एसएसएच',
      logs: 'लॉग्स',
      yamlToolkit: 'यामल टूलकिट',
      allTools: 'सभी टूल्स',
      favorites: 'पसंदीदा',
      recent: 'हालिया',
      snippets: 'स्निपेट्स',
      settings: 'सेटिंग्स',
      docs: 'दस्तावेज़ीकरण',
    },
    topbar: {
      searchPlaceholder: 'टूल्स, स्निपेट्स, प्रोजेक्ट्स खोजें...',
      toggleTheme: 'थीम बदलें',
      shortcuts: 'कीबोर्ड शॉर्टकट',
      privacy: '100% स्थानीय गोपनीयता',
      settings: 'सेटिंग्स',
      guide: 'मार्गदर्शिका',
      online: 'ऑनलाइन',
      offline: 'ऑफ़लाइन (स्थानीय)',
      storageUsed: 'स्टोरेज',
      systemHealth: 'सिस्टम स्वास्थ्य',
      back: 'वापस जाएं',
    },
    dashboard: {
      greetingMorning: 'शुभ प्रभात',
      greetingAfternoon: 'शुभ दोपहर',
      greetingEvening: 'शुभ संध्या',
      heroSubtitle: 'उत्पादन स्तर का डेवलपर कॉकपिट। सारा डेटा आपके ब्राउज़र में सुरक्षित रहता है।',
      pendingTasks: 'लंबित कार्य',
      activeProjects: 'सक्रिय प्रोजेक्ट्स',
      savedSnippets: 'सहेजे गए स्निपेट्स',
      favorites: 'पसंदीदा',
      quickAccess: 'त्वरित उपकरण',
      allToolsLink: 'सभी 15 उपयोगिताओं को देखें',
      recentActivity: 'हालिया गतिविधि',
      noRecentActivity: 'अभी तक कोई हालिया गतिविधि दर्ज नहीं की गई।',
      newTask: 'नया कार्य',
      openGuide: 'मार्गदर्शिका खोलें',
    },
    common: {
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      copy: 'कॉपी करें',
      copied: 'कॉपी हो गया!',
      import: 'इंपोर्ट करें',
      export: 'एक्सपोर्ट करें',
      run: 'चलाएं',
      clear: 'साफ़ करें',
      filter: 'फ़िल्टर',
      search: 'खोजें',
      loading: 'लोड हो रहा है...',
      success: 'सफलता',
      error: 'त्रुटि',
      warning: 'चेतावनी',
      status: 'स्थिति',
      name: 'नाम',
      actions: 'कार्रवाई',
      close: 'बंद करें',
    },
    settings: {
      title: 'सेटिंग्स',
      subtitle: 'दिखावट, भाषा, स्टोरेज सीमाएं और डेटा सुरक्षा कॉन्फ़िगर करें।',
      appearance: 'दिखावट और भाषा',
      language: 'भाषा और अंतर्राष्ट्रीयकरण',
      theme: 'इंटरफ़ेस थीम',
      themeDark: 'डार्क',
      themeLight: 'लाइट',
      themeSystem: 'सिस्टम',
      storageSection: 'स्टोरेज इंजन और कोटा सुरक्षा',
      storageDesc: 'ब्राउज़र स्टोरेज उपयोग देखें और SHA-256 सत्यता सत्यापित करें।',
      storageUsedLabel: 'प्रयुक्त स्टोरेज',
      storageQuotaLabel: 'उपलब्ध ब्राउज़र कोटा',
      backupSection: 'वर्कस्पेस डेटा और बैकअप',
      exportBackup: 'वर्कस्पेस JSON एक्सपोर्ट करें',
      importBackup: 'बैकअप फ़ाइल इंपोर्ट करें',
      resetWorkspace: 'वर्कस्पेस डेटा रीसेट करें',
      systemHealthTitle: 'कोर वेब वाइटल्स और सिस्टम स्वास्थ्य',
    },
    api: {
      send: 'भेजें',
      cancel: 'रद्द करें',
      batchRunner: 'बैच टेस्ट रनर',
      runCollection: 'कलेक्शन चलाएं',
      exportPostman: 'पोस्टमेन v2.1 एक्सपोर्ट',
      importPostman: 'पोस्टमेन कलेक्शन इंपोर्ट',
      importHar: 'HAR फ़ाइल इंपोर्ट करें',
      exportHar: 'HAR एक्सपोर्ट करें',
    },
  },
};

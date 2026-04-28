export const SUPPORTED_MODELS = [
    {provider:'auto', name: "Auto", models:[
        {id: 'auto', name: 'Auto'},
    ]},
    {provider:'google', name: "Google", models:[
        {id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash'},
        {id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro'},
    ]},
    {provider:'openai', name: "OpenAI", models:[
        {id: 'openai/gpt-4o-mini', name: 'GPT-4o-mini', disabled:true},
        {id: 'openai/gpt-5.2',name:'GPT-5-mini',disabled:true},
        {id: 'openai/gpt-oss-20b:free:thinking', name:'GPT OSS 20B'},
        {id: 'openai/o1', name: 'O1',disabled:true}
    ]},
    {provider:'anthropic', name: "Anthropic", models:[
        {id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5',disabled:true},
    ]}
]

export const DEFAULT_MODEL = SUPPORTED_MODELS[2].models[2]

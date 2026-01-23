export const SUPPORTED_MODELS = [
    {provider:'openai', name: "OpenAI", models:[
        {id: 'openai/gpt-4o-mini', name: 'GPT-4o-mini'},
        {id: 'openai/gpt-5.2',name:'GPT-5-mini'}
    ]},
    {provider:'anthropic', name: "Anthropic", models:[
        {id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5'},
    ]}
]
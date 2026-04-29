export type ModelOption = {
  id: string
  name: string
  image?: boolean
  disabled?: boolean
}

export const SUPPORTED_MODELS = [
    {provider:'auto', name: "Auto", models:[
        {id: 'auto', name: 'Auto'},
    ]},
    {provider:'google', name: "Google", models:[
        {id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', image:false},
        {id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro',image:false},
        {id:'google/gemini-3-flash-preview',name: 'Gemini 3 Flash Preview',image:true}
    ]},
    {provider:'openai', name: "OpenAI", models:[
        {id: 'openai/gpt-4o-mini', name: 'GPT-4o-mini', disabled:true ,image:false},
        {id: 'openai/gpt-5.2',name:'GPT-5-mini',disabled:true, image:false},
        {id: 'openai/gpt-oss-20b:free:thinking', name:'GPT OSS 20B', image:false},
        {id: 'openai/o1', name: 'O1',disabled:true, image:false}
    ]},
    {provider:'anthropic', name: "Anthropic", models:[
        {id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5',disabled:true,image:true},
    ]}
]

export const DEFAULT_MODEL = SUPPORTED_MODELS[2].models[2]

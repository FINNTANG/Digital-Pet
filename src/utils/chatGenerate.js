async function chatMessage(health, mood, message) {
  try {
    const response = await fetch('https://chat-gpt-4-turbo1.p.rapidapi.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': '031b5df5d1mshe7a3df6102728cep144387jsnc2ed3ac026e6',
        'x-rapidapi-host': 'chat-gpt-4-turbo1.p.rapidapi.com',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a Ragdoll cat who loves your owner’s company. You have two important attributes: mood and health. Both your mood and health will influence your behavior. Currently, your mood index is${mood}，The health index is${health}。You need to provide appropriate responses based on your current mood and health status, as well as the user's question, and offer three options for the user to choose from (described in the first person). The specific format is as follows：{result: true,  message: Response content,  options: [Option 1, Option 2, Option 3], health: Health fluctuates (positive or negative) based on interactions with the owner, mood: Mood fluctuates (positive or negative) based on interactions with the owner}，Note：The response data should be in standard JSON format，The options you provide should be described in the first person, from the user's perspective`,
              },
              {
                type: 'text',
                text: message,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    let content = data.choices[0].message.content;
    // 移除 ```json 和 ``` 标记
    content = content.replace(/```json\s*/, '').replace(/```\s*$/, '');

    // 解析清理后的 JSON
    const parsedContent = JSON.parse(content);
    return parsedContent;
  } catch (error) {
    console.error('对话生成失败:', error);
    return { result: false };
  }
}

export default chatMessage;

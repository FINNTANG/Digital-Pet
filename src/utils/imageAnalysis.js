async function analyzeImage(base64Image) {
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
          // response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Got it! Please provide the image, and I will eturn the required fields in JSON format based on the information you need，Translate into English and respond entirely in English：1.The content of the image 2.Whether the pet likes it 3.The specific reason for liking or not liking it 4.The impact of this item on the pet mood (positive or negative number)5.The impact of this item on the pet health (positive or negative number)。The specific format is as follows：{result: true,  name: The content of the recognized image,  isLike: Whether it is liked,  reason: The reason for liking or disliking,  moodEffect: Happiness impact.,  healthEffect: Health impact }',
                  // text: 'I will provide you with an image, and you should pretend to be an electronic pet. You need to tell me what it is, whether you like it or not, and if you like it, explain why. If you don't like it, also explain why, and respond entirely in English.The required response format is as follows：{name: The content of the recognized image, like: Whether I like it, reason: The reason for liking or disliking,}',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image,
                  },
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
      console.error('图片分析失败:', error);
      return { result: false };
    }
  }
  
  export default analyzeImage;
  
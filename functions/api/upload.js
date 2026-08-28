// Cloudflare Pages Functions API - 文件上传处理
// 环境变量: TG_TOKEN (Telegram Bot Token), TG_PD (Telegram Channel ID)

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 处理CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    if (!isAuthenticated(request)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExtension}`;

    // 将文件上传到Telegram频道
    const telegramResult = await uploadToTelegram(file, fileName, env);
    
    if (!telegramResult.success) {
      return new Response(JSON.stringify({ error: telegramResult.error }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 保存文件信息
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      telegramFileId: telegramResult.fileId,
      telegramMessageId: telegramResult.messageId,
      uploadTime: timestamp,
      url: telegramResult.url
    };

    // 写入KV
    if (env.UPLOADS_KV) {
      const key = `file:${timestamp}:${Math.random().toString(36).slice(2,8)}`;
      await env.UPLOADS_KV.put(key, JSON.stringify(fileInfo));
    }

    return new Response(JSON.stringify({
      success: true,
      file: fileInfo,
      message: 'File uploaded successfully to Telegram'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 处理OPTIONS请求（CORS预检）
export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// 上传文件到Telegram
async function uploadToTelegram(file, fileName, env) {
  try {
    const TG_TOKEN = env.TG_TOKEN;
    const TG_PD = env.TG_PD;

    if (!TG_TOKEN || !TG_PD) {
      return { success: false, error: 'Telegram configuration missing' };
    }

    // 将文件转换为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 构建multipart/form-data
    const formData = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    formData.append('chat_id', TG_PD);
    formData.append('caption', `📁 File: ${file.name}\n📏 Size: ${formatFileSize(file.size)}\n📅 Upload Time: ${new Date().toLocaleString()}`);

    // 判断文件类型，选择接口
    let apiUrl = '';
    let fileField = '';
    if (file.type.startsWith('image/')) {
      apiUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`;
      fileField = 'photo';
    } else {
      apiUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendDocument`;
      fileField = 'document';
    }
    formData.append(fileField, blob, fileName);

    // 发送到Telegram API
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result);
      return { success: false, error: 'Failed to send to Telegram' };
    }

    // 获取文件ID
    let fileId, messageId;
    if (file.type.startsWith('image/')) {
      const photo = result.result.photo[result.result.photo.length - 1];
      fileId = photo.file_id;
      messageId = result.result.message_id;
    } else {
      fileId = result.result.document.file_id;
      messageId = result.result.message_id;
    }

    // 通过 getFile API 获取真实 file_path
    const getFileRes = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getFile?file_id=${fileId}`);
    const getFileData = await getFileRes.json();
    let fileUrl = '';
    if (getFileData.ok && getFileData.result && getFileData.result.file_path) {
      fileUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${getFileData.result.file_path}`;
    } else {
      fileUrl = '';
    }

    return {
      success: true,
      fileId: fileId,
      messageId: messageId,
      url: fileUrl
    };

  } catch (error) {
    console.error('Telegram upload error:', error);
    return { success: false, error: 'Telegram upload failed' };
  }
}

function isAuthenticated(request) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie.includes('admin_session=1');
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 

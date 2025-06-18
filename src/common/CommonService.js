import fs from 'fs/promises';
import path from 'path';

const baseDir = process.env.DATA_DIR || '/tmp';

const writeFile = async (fileName, data) => {
    try {
        const dir = path.join(baseDir, '.user-data');
        const filePath = path.join(dir, fileName);
        // 디렉토리 존재 확인 후 생성
        await fs.mkdir(dir, { recursive: true });
        // 저장
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`File saved successfully at ${filePath}`);
    } catch (error) {
        throw error;
    }
};

const readFile = async (fileName) => {
    try {
        const dir = path.join(baseDir, '.user-data');
        const filePath = path.join(dir, fileName);
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        console.log(`File read successfully from ${filePath}`);
        return parsed;
    }
    catch (error) {
        throw error;
    }
};

export default {writeFile, readFile};
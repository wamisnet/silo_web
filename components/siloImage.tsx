import React, {createRef, useEffect, useMemo, useRef, useState} from "react";
import {NextPage} from "next";
import base from '../public/base.png';
import level_90 from '../public/level_90.png';
import level_100 from '../public/level_100.png';
import style from "./siloImage.module.css"
import {CButton} from "@coreui/react";

type Props = {
    level: number,
    judgment:[boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean]
    image:{
        base:string
        judgment:string[]
        level?:string[] // levelMaskかこれのどちらか
        levelMask?:string　//　levelかこれのどちらか　両方設定されている場合こっちを優先
    }
    color:{
        level:string[]//#00ff00aa
        judgment:{open:string,close:string}[]
    }
}

const SiloImage:NextPage<Props> = (props) => {
    const CANVAS_WIDTH = 1000
    const CANVAS_HEIGHT = 1500
    const [imageUrl,setImageUrl] = useState("")
    const [imageLoad,setImageLoad] = useState(false)
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasMaskRef = useRef<HTMLCanvasElement>(null);

    let imageBase:HTMLImageElement = new Image();
    let imageLevelMask:HTMLImageElement|undefined = props.image.levelMask?new Image():undefined;
    let imageLevelArray:(HTMLImageElement|undefined)[]|undefined = props.image.level?.map(value => !value?undefined:new Image())
    let imageJudgmentArray:(HTMLImageElement|undefined)[] = props.image.judgment.map(value => !value?undefined:new Image())

    const setLoadAllCallback = (elems:(HTMLImageElement|undefined)[], callback:()=>void) => {
        let count = 0;
        const array = elems.filter((item): item is Exclude<typeof item, undefined> => item !== undefined)
        for (let i = 0; i < array.length; ++i) {
            array[i].onload = function() {
                ++count;
                if (count == array.length) {
                    // All elements have been loaded.
                    callback();
                }
            };
        }
    }
    const getImageFromCanvas = (ctxMask: CanvasRenderingContext2D):Promise<CanvasImageSource> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = (e) => reject(e);
            image.src = ctxMask.canvas.toDataURL();
        });
    }

    setLoadAllCallback([imageBase, ...(imageLevelMask?[imageLevelMask]:imageLevelArray?imageLevelArray:[]),...imageJudgmentArray], () => {
        // すべての要素の読み込みが終わったときに呼び出される
        setImageLoad(true)
    });

    imageBase.src = props.image.base;
    if(props.image.levelMask && imageLevelMask){
        imageLevelMask.src = props.image.levelMask
    }

    if(props.image.level && imageLevelArray){
        imageLevelArray.map((value, index)=>{
            if(value && props.image.level){
                value.src = props.image.level[index]
            }
        })
    }
    if(props.image.judgment && imageJudgmentArray){
        imageJudgmentArray.map((value, index)=>{
            if(value && props.image.judgment){
                value.src = props.image.judgment[index]
            }
        })
    }

    useEffect(() => {
        if(!imageLoad){
            return ()=>{}
        }
        const canvas = canvasRef.current;
        const canvasMask = canvasMaskRef.current;
        if (!canvas || !canvasMask ) {
            throw new Error("objectがnull");
        }

        const ctxMask = canvasMask.getContext("2d");
        const ctx = canvas.getContext("2d");
        if (!ctxMask || !ctx) {
            throw new Error("context取得失敗");
        }

        const diagonalLine = (canvas: CanvasRenderingContext2D,width:number,height:number) =>{
            canvas.strokeStyle = '#fff'
            canvas.lineWidth = 5
            for(let i = -height;i<height;i+=20) {
                canvas.beginPath();
                canvas.moveTo(0, i);
                canvas.lineTo(width,width+i);
                canvas.closePath();
                canvas.stroke();
            }
        }

        const handleResize = async () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 幅を設定
            const width = canvas.width = canvasContainerRef.current? canvasContainerRef.current.clientWidth:0;
            canvas.height = imageBase.naturalHeight * (width / imageBase.naturalWidth);
            ctx.setTransform(width / imageBase.width, 0, 0, width / imageBase.width, 0, 0);

            // canvasに描画
            const index = Math.floor(props.level/10) >= 10?10:Math.floor(props.level/10)
            if(imageLevelArray && imageLevelArray[index]){
                const imageLevel = imageLevelArray[index]
                if(imageLevel){
                    ctxMask.globalCompositeOperation = 'source-over';
                    ctxMask.fillStyle = props.color.level[index];
                    ctxMask.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    ctxMask.globalCompositeOperation = 'destination-in';
                    ctxMask.drawImage(imageLevel, 0, 0);
                }
            }
            ctx.drawImage( await getImageFromCanvas(ctxMask), 0, 0);
            ctxMask.clearRect(0, 0,CANVAS_WIDTH, CANVAS_HEIGHT);

            for(let i = 0; i < 8; i++) {
                if (imageJudgmentArray[i]) {
                    const imageJudgment = imageJudgmentArray[i]
                    if (imageJudgment) {
                        ctxMask.globalCompositeOperation = 'source-over';
                        ctxMask.fillStyle = props.judgment[i]?props.color.judgment[i].close:props.color.judgment[i].open
                        ctxMask.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                        if(!props.judgment[i])
                            diagonalLine(ctxMask,CANVAS_WIDTH, CANVAS_HEIGHT)
                        ctxMask.strokeRect(90,90,100,100);
                        ctxMask.globalCompositeOperation = 'destination-in';
                        ctxMask.drawImage(imageJudgment, 0, 0);
                    }
                }
                ctx.drawImage(await getImageFromCanvas(ctxMask), 0, 0);
                ctxMask.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            // 枠入れ
            ctx.drawImage(imageBase, 0, 0);

            setImageUrl(ctx.canvas.toDataURL())
        }
        window.addEventListener("resize", handleResize);
        handleResize().then();
        return () => window.removeEventListener("resize", handleResize);
    }, [props.level,props.judgment,imageLoad]);
    return (
        <>
            <div ref={canvasContainerRef}>
                <canvas ref={canvasRef} className={style.none_display} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                <canvas ref={canvasMaskRef} className={style.none_display} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
            </div>
            <img src={imageUrl} alt={""} className={style.half_image}/>
            <CButton color="outline" onClick={async () => {
                setImageLoad(false)
                await new Promise(resolve => setTimeout(resolve, 100))
                setImageLoad(true)
            }}>
                サイロの表示がおかしくなったら押してください
            </CButton>
        </>
    );
};
//

export default SiloImage;
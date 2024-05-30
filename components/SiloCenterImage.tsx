import {NextPage} from "next";
import style from "./siloImage.module.css"

type Props = {
    level: number,
    maxJudgment:boolean
    cementType:"normal"|"blast-furnace"|"high-early-strength"|"fly-ash"|"other"
}

const SiloCenterImage:NextPage<Props> = (props) => {
    return (
        <>
            <img src={`/image/silo/center/level_${props.cementType}_${props.maxJudgment?"100":Math.round((Math.abs(props.level) <= 100?Math.abs(props.level):100 )/ 10) * 10}.png`} alt={"silo level"} className={style.half_image_center}/>
        </>
    );
};
//

export default SiloCenterImage;
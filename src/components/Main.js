import React, {useState, useEffect} from "react";
import { useForm } from "react-hook-form";
import firebase from "../firebase/config";
import { yupResolver } from "@hookform/resolvers";
import * as yup from "yup";


const schema = yup.object().shape({
    title: yup.string().required(),
    content: yup.string().required().max(20),
    cover: yup.mixed().test("cover", "the file must be jpg", (value) => {
       if(value[0]){
           return value && value[0].type === "image/jpeg";
       }
    })
})


const Main = () => {
   
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState("");
    const [isBusy, setIsBusy] = useState(false);
  
    //-- REACT HOOK FORM
    const { register, handleSubmit, errors } = useForm({
        resolver: yupResolver(schema),
    });
    


    const onSubmit = async(data) => {
        setIsBusy(true);
        addPost(data);
      
    }

    const addPost = async(data) =>{
        console.log(data)
        let d;
     
        let post = {
            title: data.title,
            content: data.content,
            cover: data.cover[0]
        }
    
        
        const storageRef = firebase.storage.ref();
        const storageChild = storageRef.child(post.cover.name);
        const postCover = storageChild.put(post.cover);
    
        await new Promise(resolve => {
            postCover.on("state_changed", (snapshot) => {
                let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setLoading(Math.trunc(progress));
            }, (error) => {
                //error
                console.log(error);
            }, async() => {
                //completed
                const downloadURL = await storageChild.getDownloadURL();
                d = downloadURL;
                console.log(d);
                resolve();
            });
        });
    
        firebase.createPost(d, post).then((post) => {
            console.log("post created successfully", post);
            setIsBusy(false);
            getPosts();
        }).catch(err => {
            console.log(err);
        });
        
        
    
      }


    //-- ENDOF REACT HOOK FORM
  
    //get all posts
    const getPosts = async() => {
   
      const postsArray = await firebase.getAllPosts().catch(err => console.log(err) );
      if(postsArray){
        let _posts = [];
        postsArray.forEach(post => {
          _posts.push({
            id: post.id,
            data: post.data()
          });
        });
  
        setPosts(_posts);
      }
  
    }

    useEffect(() => {
      console.log("mounted")
      getPosts();
    }, [])

    return (   
        <React.Fragment>
          <div className="container">
            <form onSubmit={handleSubmit(onSubmit)}>

            { isBusy && <p>Uploading file, please wait... {loading + "%"}</p>}


            <label>Post Title</label>
            <input name="title" ref={register} />
            {errors.title && <p className="error">{errors.title.message}</p>}
          
            <label>Post Content</label>
            <textarea name="content" ref={register}></textarea>
            {errors.content && <p className="error">{errors.content.message}</p>}
           
            <label>Post Cover</label>
            <input type="file" name="cover" ref={register} />
            {errors.cover && <p className="error">{errors.cover.message}</p>}
            
            <input disabled={isBusy} type="submit" />

            </form>

            <div className="posts">
                {posts.map(post => {
                    return (
                        <div className="post" key={post.id}>
                            <div className="cover" style={{backgroundImage: "url(" + post.data.cover + ")" }} />
                        </div>
                    )
                })}
            </div>


          </div>
        </React.Fragment>
    )
}


export default Main;